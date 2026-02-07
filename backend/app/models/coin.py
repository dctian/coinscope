"""Pydantic models for coin identification requests and responses."""

from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class Coin(BaseModel):
    """Represents an identified coin."""

    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str = Field(..., description="Name of the coin (e.g., 'Lincoln Penny')")
    country: str = Field(..., description="Country of origin")
    year: Optional[int] = Field(None, description="Year minted (if visible)")
    denomination: str = Field(..., description="Face value denomination (e.g., '1 cent')")
    face_value: Optional[float] = Field(None, description="Numeric face value")
    currency: str = Field(..., description="Currency code (e.g., 'USD')")
    obverse_description: Optional[str] = Field(None, description="Description of the front side")
    reverse_description: Optional[str] = Field(None, description="Description of the back side")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score of identification")
    bbox: Optional[list[float]] = Field(
        None,
        description="Bounding box [x_min, y_min, x_max, y_max] normalized 0-1",
    )


class CoinIdentificationResponse(BaseModel):
    """Response from coin identification endpoint."""

    coins: list[Coin] = Field(default_factory=list, description="List of identified coins")
    total_coins_detected: int = Field(..., description="Total number of coins detected")
    model_used: str = Field(..., description="VLM model used for identification")
