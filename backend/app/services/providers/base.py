"""
Abstract base class for VLM providers.

All VLM providers must implement the `identify` method, which accepts
preprocessed image bytes and a prompt string, returning the raw model response.
"""

from abc import ABC, abstractmethod


class BaseVLMProvider(ABC):
    """Abstract base class for Vision Language Model providers."""

    @abstractmethod
    async def identify(self, image_bytes: bytes, prompt: str) -> str:
        """Send an image and prompt to the VLM and return the raw text response.

        Args:
            image_bytes: Preprocessed image bytes (already resized to JPEG).
            prompt: The identification prompt to send alongside the image.

        Returns:
            Raw text response from the model.
        """
        ...
