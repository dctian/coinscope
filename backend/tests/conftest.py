"""Shared fixtures for CoinScope backend tests."""

import io

import pytest
from PIL import Image


# ---------------------------------------------------------------------------
# Tiny valid image fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def jpeg_bytes() -> bytes:
    """A minimal valid JPEG image (1x1 red pixel)."""
    img = Image.new("RGB", (1, 1), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture
def png_bytes() -> bytes:
    """A minimal valid PNG image (1x1 blue pixel)."""
    img = Image.new("RGB", (1, 1), color=(0, 0, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def rgba_png_bytes() -> bytes:
    """A small RGBA PNG image (2x2) for testing mode conversion."""
    img = Image.new("RGBA", (2, 2), color=(0, 255, 0, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def large_jpeg_bytes() -> bytes:
    """A JPEG larger than 1280px on its longest side (2000x1000)."""
    img = Image.new("RGB", (2000, 1000), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture
def gif_magic_bytes() -> bytes:
    """Bytes starting with GIF magic number."""
    return b"GIF89a" + b"\x00" * 100


@pytest.fixture
def webp_magic_bytes() -> bytes:
    """Bytes starting with RIFF/WEBP magic number."""
    return b"RIFF" + b"\x00\x00\x00\x00" + b"WEBP" + b"\x00" * 100


@pytest.fixture
def sample_coin_data() -> list[dict]:
    """Sample valid coin data as returned by a VLM."""
    return [
        {
            "name": "Lincoln Penny",
            "country": "United States",
            "year": 2020,
            "denomination": "1 cent",
            "face_value": 0.01,
            "currency": "USD",
            "obverse_description": "Abraham Lincoln portrait",
            "reverse_description": "Lincoln Memorial shield",
            "confidence": 0.95,
            "bbox": [0.1, 0.2, 0.5, 0.6],
        },
        {
            "name": "Canadian Quarter",
            "country": "Canada",
            "year": 2017,
            "denomination": "25 cents",
            "face_value": 0.25,
            "currency": "CAD",
            "obverse_description": "Queen Elizabeth II",
            "reverse_description": "Caribou",
            "confidence": 0.88,
            "bbox": [0.55, 0.2, 0.9, 0.7],
        },
    ]
