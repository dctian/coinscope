"""
VLM Service -- slim orchestrator for coin identification.

Composes ImageProcessor, PromptBuilder, provider implementations, and
ResponseParser into a single high-level `identify_coins` call.
"""

import asyncio
import logging
import os
from typing import Optional

from ..models.coin import Coin
from .image_processor import ImageProcessor
from .prompt_builder import PromptBuilder
from .response_parser import ResponseParser
from .providers.base import BaseVLMProvider
from .providers.gemini import GeminiProvider
from .providers.litellm_provider import LiteLLMProvider

logger = logging.getLogger(__name__)

SUPPORTED_PROVIDERS = ["gemini", "openai", "anthropic", "litellm"]


class VLMService:
    """Orchestrates coin identification across VLM providers."""

    MAX_RETRIES = 3
    RETRY_DELAY_SECONDS = 2

    def __init__(self, model: Optional[str] = None) -> None:
        self.model = model or os.getenv("VLM_MODEL", "gemini/gemini-flash-latest")
        self._provider = self._build_provider()

    # ------------------------------------------------------------------
    # Provider factory
    # ------------------------------------------------------------------

    def _build_provider(self) -> BaseVLMProvider:
        """Select and instantiate the appropriate provider."""
        if self._is_gemini_model() and GeminiProvider.is_available():
            model_name = GeminiProvider.extract_model_name(self.model)
            return GeminiProvider(model_name)
        return LiteLLMProvider(self.model)

    def _is_gemini_model(self) -> bool:
        return "gemini" in self.model.lower()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def identify_coins(self, image_bytes: bytes) -> tuple[list[Coin], str]:
        """Identify coins in *image_bytes* and return (coins, model_used)."""
        prompt = PromptBuilder.build()

        # Prepare image variants (original + resized fallback)
        processed = ImageProcessor.resize_image(image_bytes, max_size=2048)
        variants = [("original", image_bytes)]
        if processed != image_bytes:
            variants.append(("resized", processed))

        coins_data: list[dict] = []
        last_error: Optional[Exception] = None

        for variant_name, payload in variants:
            for attempt in range(self.MAX_RETRIES):
                try:
                    response_text = await self._provider.identify(payload, prompt)
                    coins_data = ResponseParser.parse_json_response(response_text)
                    if coins_data:
                        break
                except Exception as exc:
                    last_error = exc
                    logger.warning(
                        "Attempt %d/%d (%s) failed: %s",
                        attempt + 1, self.MAX_RETRIES, variant_name, exc,
                    )
                    if attempt < self.MAX_RETRIES - 1:
                        await asyncio.sleep(self.RETRY_DELAY_SECONDS)
                        continue
                    raise
            if coins_data:
                break
        else:
            if last_error:
                raise last_error

        coins = ResponseParser.parse_coins(coins_data)
        return coins, self.model
