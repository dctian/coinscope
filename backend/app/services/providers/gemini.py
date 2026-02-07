"""
Google Gemini provider using the google-generativeai SDK.

Calls the Gemini API directly for better image handling compared to the
LiteLLM passthrough.
"""

import asyncio
import logging
import os

from .base import BaseVLMProvider

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    genai = None  # type: ignore[assignment]
    GENAI_AVAILABLE = False


class GeminiProvider(BaseVLMProvider):
    """Gemini provider using the google-generativeai SDK."""

    def __init__(self, model_name: str) -> None:
        self.model_name = model_name
        if GENAI_AVAILABLE:
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                genai.configure(api_key=api_key)

    @staticmethod
    def is_available() -> bool:
        """Return True if the google-generativeai SDK is installed."""
        return GENAI_AVAILABLE

    @staticmethod
    def extract_model_name(model_string: str) -> str:
        """Extract bare model name from a 'gemini/...' prefixed string."""
        if model_string.startswith("gemini/"):
            return model_string[7:]
        return model_string

    async def identify(self, image_bytes: bytes, prompt: str) -> str:
        """Call Gemini with an image and prompt, returning raw text."""
        model = genai.GenerativeModel(self.model_name)
        image_part = {"mime_type": "image/jpeg", "data": image_bytes}

        def _sync_generate() -> str:
            response = model.generate_content(
                [prompt, image_part],
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=4000,
                ),
            )
            return response.text

        loop = asyncio.get_event_loop()
        response_text = await loop.run_in_executor(None, _sync_generate)
        logger.debug("Gemini response: %s", response_text[:500])
        return response_text
