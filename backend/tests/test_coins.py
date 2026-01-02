"""
Tests for the coin identification API endpoint.

Run with: pytest tests/test_coins.py -v

Note: These tests require the backend server to be running at http://localhost:8000
Start it with: uvicorn app.main:app --reload
"""

import os
from pathlib import Path

import httpx
import pytest


# Server URL
BASE_URL = os.getenv("TEST_API_URL", "http://localhost:8000")

# Test data directory
TESTDATA_DIR = Path(__file__).parent.parent.parent / "testdata"


@pytest.fixture
def client():
    """Create an HTTP client for testing."""
    return httpx.Client(base_url=BASE_URL, timeout=60.0)


@pytest.fixture
def coin1_image():
    """Load the coin1.jpg test image."""
    image_path = TESTDATA_DIR / "coin1.jpg"
    if not image_path.exists():
        pytest.skip(f"Test image not found: {image_path}")
    
    with open(image_path, "rb") as f:
        return f.read()


class TestHealthEndpoint:
    """Tests for the health check endpoint."""
    
    def test_health_check(self, client):
        """Test that health endpoint returns status and model info."""
        response = client.get("/api/v1/coins/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "model" in data
        print(f"\n✓ Health check passed. Model: {data['model']}")


class TestRootEndpoint:
    """Tests for the root endpoint."""
    
    def test_root_returns_api_info(self, client):
        """Test that root endpoint returns API information."""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "CoinScope API"
        assert data["version"] == "1.0.0"
        assert "docs" in data
        print(f"\n✓ Root endpoint returned: {data['name']} v{data['version']}")


class TestCoinIdentification:
    """Tests for the coin identification endpoint."""
    
    def test_identify_coins_with_valid_image(self, client, coin1_image):
        """
        Test coin identification with coin1.jpg (Hungarian Forint).
        
        Expected: The API should identify this as a Hungarian coin.
        Note: This test requires a valid VLM API key to be configured.
        """
        response = client.post(
            "/api/v1/coins/identify",
            files={"image": ("coin1.jpg", coin1_image, "image/jpeg")}
        )
        
        # Check response status
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        # Validate response structure
        assert "coins" in data
        assert "total_coins_detected" in data
        assert "model_used" in data
        
        # Check that at least one coin was detected
        assert data["total_coins_detected"] >= 1, "No coins detected in the image"
        assert len(data["coins"]) >= 1
        
        # Validate first coin structure
        coin = data["coins"][0]
        assert "id" in coin
        assert "name" in coin
        assert "country" in coin
        assert "denomination" in coin
        assert "currency" in coin
        assert "confidence" in coin
        
        # Print coin details
        print(f"\n--- Identified Coin ---")
        print(f"  Name: {coin['name']}")
        print(f"  Country: {coin['country']}")
        print(f"  Year: {coin.get('year', 'Unknown')}")
        print(f"  Denomination: {coin['denomination']}")
        print(f"  Currency: {coin['currency']}")
        print(f"  Confidence: {coin['confidence']:.0%}")
        if coin.get('obverse_description'):
            print(f"  Front: {coin['obverse_description']}")
        if coin.get('reverse_description'):
            print(f"  Back: {coin['reverse_description']}")
        print(f"  Model Used: {data['model_used']}")
        
    def test_identify_coins_requires_image(self, client):
        """Test that the endpoint returns 422 when no image is provided."""
        response = client.post("/api/v1/coins/identify")
        
        assert response.status_code == 422  # Validation error
        print("\n✓ Correctly rejected request without image")
    
    def test_identify_coins_rejects_non_image(self, client):
        """Test that the endpoint rejects non-image files."""
        response = client.post(
            "/api/v1/coins/identify",
            files={"image": ("test.txt", b"This is not an image", "text/plain")}
        )
        
        assert response.status_code == 400
        assert "Invalid file type" in response.json()["detail"]
        print("\n✓ Correctly rejected non-image file")


class TestCoinIdentificationQuality:
    """
    Integration test that verifies VLM coin identification quality.
    
    This test verifies that the VLM returns reasonable coin data
    with expected fields populated.
    """
    
    def test_coin_identification_returns_valid_data(self, client, coin1_image):
        """Verify that coin identification returns properly structured data."""
        response = client.post(
            "/api/v1/coins/identify",
            files={"image": ("coin1.jpg", coin1_image, "image/jpeg")}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["coins"]) >= 1, "Expected at least one coin to be detected"
        coin = data["coins"][0]
        
        # Verify all expected fields are present and have values
        print(f"\n--- Coin Identification Result ---")
        print(f"  Name: {coin['name']}")
        print(f"  Country: {coin['country']}")
        print(f"  Year: {coin['year']}")
        print(f"  Denomination: {coin['denomination']}")
        print(f"  Face Value: {coin['face_value']} {coin['currency']}")
        print(f"  Confidence: {coin['confidence']}")
        
        # Check that required fields have reasonable values
        assert coin["name"] and len(coin["name"]) > 0, "Name should not be empty"
        assert coin["country"] and len(coin["country"]) > 0, "Country should not be empty"
        assert coin["denomination"] and len(coin["denomination"]) > 0, "Denomination should not be empty"
        assert coin["currency"] and len(coin["currency"]) > 0, "Currency should not be empty"
        assert 0 <= coin["confidence"] <= 1.0, "Confidence should be between 0 and 1"
        
        print("  ✓ Coin data is valid and complete!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
