"""
LiteLLM-based provider for OpenAI, Anthropic, and other VLM backends.

Routes requests through LiteLLM's unified API, which handles authentication
and payload formatting for each upstream provider.
"""

import logging
import os

import litellm

from .base import BaseVLMProvider
from ..image_processor import ImageProcessor

logger = logging.getLogger(__name__)


class LiteLLMProvider(BaseVLMProvider):
    """LiteLLM provider supporting OpenAI, Anthropic, and others."""

    def __init__(self, model: str) -> None:
        self.model = model
        litellm.set_verbose = os.getenv("DEBUG", "false").lower() == "true"

    async def identify(self, image_bytes: bytes, prompt: str) -> str:
        """Send image + prompt through LiteLLM and return raw text."""
        image_b64 = ImageProcessor.encode_image(image_bytes)
        data_url = f"data:image/jpeg;base64,{image_b64}"

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": data_url},
                    },
                ],
            }
        ]

        response = await litellm.acompletion(
            model=self.model,
            messages=messages,
            max_tokens=4000,
            temperature=0.1,
        )

        text = response.choices[0].message.content
        logger.debug("LiteLLM response: %s", text[:500] if text else "")
        return text or ""
