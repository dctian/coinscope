"""
VLM provider implementations for coin identification.

Supports multiple providers including Gemini (direct SDK) and LiteLLM-based
providers (OpenAI, Anthropic, etc.).
"""

from .base import BaseVLMProvider
from .gemini import GeminiProvider
from .litellm_provider import LiteLLMProvider

__all__ = ["BaseVLMProvider", "GeminiProvider", "LiteLLMProvider"]
