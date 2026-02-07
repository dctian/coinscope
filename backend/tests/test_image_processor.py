"""Tests for app.services.image_processor.ImageProcessor."""

import base64
import io

import pytest
from PIL import Image

from app.services.image_processor import ImageProcessor


class TestResizeImage:
    """Tests for ImageProcessor.resize_image."""

    def test_small_image_unchanged_dimensions(self, jpeg_bytes: bytes):
        """An image already under max_size should keep its dimensions."""
        result = ImageProcessor.resize_image(jpeg_bytes, max_size=1280)
        img = Image.open(io.BytesIO(result))
        # 1x1 image is well under 1280 -- dimensions should be 1x1
        assert img.size == (1, 1)

    def test_large_image_resized(self, large_jpeg_bytes: bytes):
        """A 2000x1000 image should be resized so the longest side = max_size."""
        result = ImageProcessor.resize_image(large_jpeg_bytes, max_size=1280)
        img = Image.open(io.BytesIO(result))
        w, h = img.size
        assert max(w, h) == 1280
        # Aspect ratio: original 2000x1000 -> 1280x640
        assert w == 1280
        assert h == 640

    def test_custom_max_size(self, large_jpeg_bytes: bytes):
        """Resize should honour a custom max_size parameter."""
        result = ImageProcessor.resize_image(large_jpeg_bytes, max_size=500)
        img = Image.open(io.BytesIO(result))
        assert max(img.size) == 500

    def test_rgba_converted_to_rgb(self, rgba_png_bytes: bytes):
        """RGBA images should be converted to RGB (JPEG output)."""
        result = ImageProcessor.resize_image(rgba_png_bytes, max_size=1280)
        img = Image.open(io.BytesIO(result))
        assert img.mode == "RGB"

    def test_output_is_jpeg(self, png_bytes: bytes):
        """Regardless of input format the output must be JPEG."""
        result = ImageProcessor.resize_image(png_bytes, max_size=1280)
        # JPEG magic bytes
        assert result[:3] == b"\xff\xd8\xff"

    def test_tall_image_resized_by_height(self):
        """A portrait (tall) image should resize by height."""
        img = Image.new("RGB", (500, 3000), color=(0, 0, 0))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        result = ImageProcessor.resize_image(buf.getvalue(), max_size=1280)
        out = Image.open(io.BytesIO(result))
        assert out.size[1] == 1280
        # Width should scale proportionally: 500 * (1280/3000) = ~213
        assert out.size[0] == int(500 * (1280 / 3000))


class TestEncodeImage:
    """Tests for ImageProcessor.encode_image."""

    def test_base64_round_trip(self, jpeg_bytes: bytes):
        """Encoding and then decoding should give back original bytes."""
        encoded = ImageProcessor.encode_image(jpeg_bytes)
        assert isinstance(encoded, str)
        decoded = base64.b64decode(encoded)
        assert decoded == jpeg_bytes

    def test_returns_string(self, jpeg_bytes: bytes):
        """encode_image must return a plain Python str, not bytes."""
        result = ImageProcessor.encode_image(jpeg_bytes)
        assert isinstance(result, str)


class TestGetMediaType:
    """Tests for ImageProcessor.get_media_type."""

    def test_jpeg_detection(self, jpeg_bytes: bytes):
        assert ImageProcessor.get_media_type(jpeg_bytes) == "image/jpeg"

    def test_png_detection(self, png_bytes: bytes):
        assert ImageProcessor.get_media_type(png_bytes) == "image/png"

    def test_gif_detection(self, gif_magic_bytes: bytes):
        assert ImageProcessor.get_media_type(gif_magic_bytes) == "image/gif"

    def test_webp_detection(self, webp_magic_bytes: bytes):
        assert ImageProcessor.get_media_type(webp_magic_bytes) == "image/webp"

    def test_unknown_defaults_to_jpeg(self):
        """Unknown magic bytes should default to image/jpeg."""
        assert ImageProcessor.get_media_type(b"\x00\x00\x00\x00") == "image/jpeg"
