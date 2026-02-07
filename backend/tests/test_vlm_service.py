"""Tests for app.services.vlm_service.VLMService."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio

from app.models.coin import Coin
from app.services.vlm_service import VLMService


@pytest.fixture
def mock_provider():
    """Create a mock VLM provider with an async identify method."""
    provider = AsyncMock()
    provider.identify = AsyncMock()
    return provider


@pytest.fixture
def sample_vlm_response(sample_coin_data: list[dict]) -> str:
    """A valid JSON string response from a VLM provider."""
    return json.dumps(sample_coin_data)


@pytest.fixture
def vlm_service_with_mock(mock_provider) -> VLMService:
    """A VLMService instance with its provider replaced by the mock."""
    service = VLMService.__new__(VLMService)
    service.model = "test-model"
    service._provider = mock_provider
    service.MAX_RETRIES = 3
    service.RETRY_DELAY_SECONDS = 0  # Don't slow down tests
    return service


class TestVLMServiceInit:
    """Tests for VLMService initialisation."""

    @patch.dict("os.environ", {"VLM_MODEL": "openai/gpt-4o"}, clear=False)
    @patch("app.services.vlm_service.LiteLLMProvider")
    def test_default_model_from_env(self, mock_litellm_cls):
        """VLMService should read VLM_MODEL from the environment."""
        service = VLMService()
        assert service.model == "openai/gpt-4o"

    @patch("app.services.vlm_service.LiteLLMProvider")
    def test_explicit_model_override(self, mock_litellm_cls):
        """An explicit model argument should override the env var."""
        service = VLMService(model="anthropic/claude-3")
        assert service.model == "anthropic/claude-3"


class TestIdentifyCoins:
    """Tests for VLMService.identify_coins."""

    @pytest.mark.asyncio
    async def test_successful_identification(
        self,
        vlm_service_with_mock: VLMService,
        mock_provider,
        sample_vlm_response: str,
        jpeg_bytes: bytes,
    ):
        """Happy path: provider returns valid JSON, coins are parsed."""
        mock_provider.identify.return_value = sample_vlm_response

        coins, model = await vlm_service_with_mock.identify_coins(jpeg_bytes)

        assert model == "test-model"
        assert len(coins) == 2
        assert all(isinstance(c, Coin) for c in coins)
        assert coins[0].name == "Lincoln Penny"
        mock_provider.identify.assert_called()

    @pytest.mark.asyncio
    async def test_empty_response_returns_no_coins(
        self,
        vlm_service_with_mock: VLMService,
        mock_provider,
        jpeg_bytes: bytes,
    ):
        """If the VLM returns an empty array, we get zero coins."""
        mock_provider.identify.return_value = "[]"

        coins, model = await vlm_service_with_mock.identify_coins(jpeg_bytes)

        assert coins == []
        assert model == "test-model"

    @pytest.mark.asyncio
    async def test_retry_on_exception(
        self,
        vlm_service_with_mock: VLMService,
        mock_provider,
        sample_vlm_response: str,
        jpeg_bytes: bytes,
    ):
        """The service should retry on provider failure, then succeed."""
        mock_provider.identify.side_effect = [
            RuntimeError("API timeout"),
            sample_vlm_response,
        ]

        coins, model = await vlm_service_with_mock.identify_coins(jpeg_bytes)

        assert len(coins) == 2
        assert mock_provider.identify.call_count == 2

    @pytest.mark.asyncio
    async def test_all_retries_exhausted_raises(
        self,
        vlm_service_with_mock: VLMService,
        mock_provider,
        jpeg_bytes: bytes,
    ):
        """After MAX_RETRIES failures the exception should propagate."""
        mock_provider.identify.side_effect = RuntimeError("permanent failure")

        with pytest.raises(RuntimeError, match="permanent failure"):
            await vlm_service_with_mock.identify_coins(jpeg_bytes)

        # Should have been called MAX_RETRIES times for the first variant
        assert mock_provider.identify.call_count == vlm_service_with_mock.MAX_RETRIES

    @pytest.mark.asyncio
    async def test_markdown_wrapped_response_parsed(
        self,
        vlm_service_with_mock: VLMService,
        mock_provider,
        sample_coin_data: list[dict],
        jpeg_bytes: bytes,
    ):
        """Markdown-fenced JSON from the VLM should still be parsed."""
        wrapped = "```json\n" + json.dumps(sample_coin_data) + "\n```"
        mock_provider.identify.return_value = wrapped

        coins, _ = await vlm_service_with_mock.identify_coins(jpeg_bytes)
        assert len(coins) == 2
