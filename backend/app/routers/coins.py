"""
Coin identification API endpoints.
"""

from fastapi import APIRouter, File, UploadFile, HTTPException
from ..models.coin import CoinIdentificationResponse
from ..services.vlm_service import VLMService

router = APIRouter(prefix="/api/v1/coins", tags=["coins"])

# Initialize VLM service
vlm_service = VLMService()


def _is_valid_image(content_type: str | None, image_bytes: bytes) -> bool:
    """Check if file is a valid image by content type or magic bytes."""
    # Check content type first
    if content_type and content_type.startswith("image/"):
        return True
    
    # Fall back to checking magic bytes
    if len(image_bytes) < 4:
        return False
    
    # JPEG
    if image_bytes[0:3] == b'\xff\xd8\xff':
        return True
    # PNG
    if image_bytes[0:8] == b'\x89PNG\r\n\x1a\n':
        return True
    # GIF
    if image_bytes[0:3] == b'GIF':
        return True
    # WebP
    if image_bytes[0:4] == b'RIFF' and len(image_bytes) > 11 and image_bytes[8:12] == b'WEBP':
        return True
    
    return False


@router.post("/identify", response_model=CoinIdentificationResponse)
async def identify_coins(image: UploadFile = File(...)):
    """
    Identify coins in an uploaded image.
    
    Accepts JPEG, PNG, GIF, or WebP images.
    Returns identified coins with country, year, denomination, and more.
    """
    # Read image bytes first
    try:
        image_bytes = await image.read()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read image: {str(e)}"
        )
    
    # Validate file type (check both content_type and magic bytes)
    if not _is_valid_image(image.content_type, image_bytes):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)."
        )
    
    # Validate image size (max 20MB)
    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image too large. Maximum size is 20MB."
        )
    
    # Identify coins
    try:
        coins, model_used = await vlm_service.identify_coins(image_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Coin identification failed: {str(e)}"
        )
    
    return CoinIdentificationResponse(
        coins=coins,
        total_coins_detected=len(coins),
        model_used=model_used
    )


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model": vlm_service.model
    }

