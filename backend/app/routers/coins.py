"""
Coin identification API endpoints.
"""

from fastapi import APIRouter, File, UploadFile, HTTPException
from ..models.coin import CoinIdentificationResponse
from ..services.vlm_service import VLMService

router = APIRouter(prefix="/api/v1/coins", tags=["coins"])

# Initialize VLM service
vlm_service = VLMService()


@router.post("/identify", response_model=CoinIdentificationResponse)
async def identify_coins(image: UploadFile = File(...)):
    """
    Identify coins in an uploaded image.
    
    Accepts JPEG, PNG, GIF, or WebP images.
    Returns identified coins with country, year, denomination, and more.
    """
    # Validate file type
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)."
        )
    
    # Read image bytes
    try:
        image_bytes = await image.read()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read image: {str(e)}"
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

