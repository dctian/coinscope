"""
Coin identification API endpoints.

Provides the /identify endpoint for image-based coin detection, a /providers
endpoint for introspecting available VLM backends, and a /health check.
"""

import logging

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..models.coin import CoinIdentificationResponse
from ..services.vlm_service import VLMService, SUPPORTED_PROVIDERS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/coins", tags=["coins"])

limiter = Limiter(key_func=get_remote_address)


# ---------------------------------------------------------------------------
# Dependency injection
# ---------------------------------------------------------------------------

async def get_vlm_service() -> VLMService:
    """Provide a VLMService instance to endpoint handlers."""
    return VLMService()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _is_valid_image(content_type: str | None, image_bytes: bytes) -> bool:
    """Check if file is a valid image by content type or magic bytes."""
    if content_type and content_type.startswith("image/"):
        return True
    if len(image_bytes) < 4:
        return False
    if image_bytes[0:3] == b"\xff\xd8\xff":
        return True
    if image_bytes[0:8] == b"\x89PNG\r\n\x1a\n":
        return True
    if image_bytes[0:3] == b"GIF":
        return True
    if image_bytes[0:4] == b"RIFF" and len(image_bytes) > 11 and image_bytes[8:12] == b"WEBP":
        return True
    return False


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/identify", response_model=CoinIdentificationResponse)
@limiter.limit("10/minute")
async def identify_coins(
    request: Request,
    image: UploadFile = File(...),
    vlm_service: VLMService = Depends(get_vlm_service),
):
    """Identify coins in an uploaded image.

    Accepts JPEG, PNG, GIF, or WebP images.
    Returns identified coins with country, year, denomination, and more.
    """
    # Read image bytes
    try:
        image_bytes = await image.read()
    except Exception:
        logger.exception("Failed to read uploaded image")
        raise HTTPException(
            status_code=400,
            detail="Failed to read image. Please try again.",
        )

    # Validate file type
    if not _is_valid_image(image.content_type, image_bytes):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP).",
        )

    # Validate image size (max 20 MB)
    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image too large. Maximum size is 20MB.",
        )

    # Identify coins
    try:
        coins, model_used = await vlm_service.identify_coins(image_bytes)
    except Exception:
        logger.exception("Coin identification failed")
        raise HTTPException(
            status_code=500,
            detail="Coin identification failed. Please try again.",
        )

    return CoinIdentificationResponse(
        coins=coins,
        total_coins_detected=len(coins),
        model_used=model_used,
    )


@router.get("/providers")
async def list_providers(
    vlm_service: VLMService = Depends(get_vlm_service),
):
    """Return the active model and list of supported providers."""
    return {
        "active_model": vlm_service.model,
        "supported_providers": SUPPORTED_PROVIDERS,
    }


@router.get("/health")
async def health_check(
    vlm_service: VLMService = Depends(get_vlm_service),
):
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model": vlm_service.model,
    }
