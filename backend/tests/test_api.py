"""Tests for the FastAPI endpoints in app.routers.coins.

Uses httpx.AsyncClient with ASGITransport -- no running server required.
The VLMService dependency is overridden with a mock so no real API keys are needed.
"""

import io
import json
from unittest.mock import AsyncMock, patch

import pytest
import httpx

from app.main import app
from app.models.coin import Coin
from app.routers.coins import get_vlm_service
from app.services.vlm_service import VLMService


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_coins() -> list[Coin]:
    """Build a list of Coin instances for mocking."""
    return [
        Coin(
            name="Lincoln Penny",
            country="United States",
            year=2020,
            denomination="1 cent",
            face_value=0.01,
            currency="USD",
            confidence=0.95,
        ),
    ]


def _mock_vlm_service(coins: list[Coin] | None = None, model: str = "test-model"):
    """Create a mock VLMService whose identify_coins returns *coins*."""
    service = AsyncMock(spec=VLMService)
    service.model = model
    service.identify_coins = AsyncMock(return_value=(coins or _make_coins(), model))
    return service


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_service():
    """A default mock VLMService."""
    return _mock_vlm_service()


@pytest.fixture
def override_app(mock_service):
    """Patch the FastAPI dependency so the mock service is injected."""
    app.dependency_overrides[get_vlm_service] = lambda: mock_service
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def jpeg_upload_bytes() -> bytes:
    """Minimal JPEG bytes for uploading."""
    from PIL import Image
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), color=(255, 0, 0)).save(buf, format="JPEG")
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestIdentifyEndpoint:
    """Tests for POST /api/v1/coins/identify."""

    @pytest.mark.asyncio
    async def test_valid_image_returns_coins(
        self, override_app, mock_service, jpeg_upload_bytes: bytes
    ):
        """A valid JPEG upload should return identified coins."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/coins/identify",
                files={"image": ("coin.jpg", jpeg_upload_bytes, "image/jpeg")},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["total_coins_detected"] == 1
        assert data["coins"][0]["name"] == "Lincoln Penny"
        assert data["model_used"] == "test-model"

    @pytest.mark.asyncio
    async def test_invalid_file_type_returns_400(self, override_app):
        """Uploading a non-image file should return 400."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/coins/identify",
                files={"image": ("test.txt", b"not an image", "text/plain")},
            )

        assert resp.status_code == 400
        assert "Invalid file type" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_missing_file_returns_422(self, override_app):
        """A request without a file should return 422 (validation error)."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/v1/coins/identify")

        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_vlm_failure_returns_500(self, override_app, mock_service, jpeg_upload_bytes):
        """If the VLM service raises, the endpoint should return 500."""
        mock_service.identify_coins.side_effect = RuntimeError("VLM down")

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/coins/identify",
                files={"image": ("coin.jpg", jpeg_upload_bytes, "image/jpeg")},
            )

        assert resp.status_code == 500
        assert "failed" in resp.json()["detail"].lower()


class TestHealthEndpoint:
    """Tests for GET /api/v1/coins/health."""

    @pytest.mark.asyncio
    async def test_health_returns_ok(self, override_app):
        """Health endpoint should return status=healthy."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/v1/coins/health")

        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert "model" in data


class TestProvidersEndpoint:
    """Tests for GET /api/v1/coins/providers."""

    @pytest.mark.asyncio
    async def test_providers_returns_list(self, override_app):
        """Providers endpoint should return active model and supported list."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/v1/coins/providers")

        assert resp.status_code == 200
        data = resp.json()
        assert "active_model" in data
        assert "supported_providers" in data
        assert isinstance(data["supported_providers"], list)
        assert len(data["supported_providers"]) > 0
