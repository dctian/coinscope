"""
Image preprocessing utilities for coin identification.

Handles resizing, encoding, and media-type detection so that downstream
providers receive consistently formatted image data.
"""

import base64
from io import BytesIO

from PIL import Image


class ImageProcessor:
    """Stateless image processing utilities."""

    @staticmethod
    def resize_image(image_bytes: bytes, max_size: int = 1280) -> bytes:
        """Resize image to fit within *max_size* pixels on its longest side.

        Preserves aspect ratio.  Converts RGBA/P images to RGB and outputs
        high-quality JPEG bytes.
        """
        img = Image.open(BytesIO(image_bytes))
        width, height = img.size

        if width > max_size or height > max_size:
            if width > height:
                new_width = max_size
                new_height = int(height * (max_size / width))
            else:
                new_height = max_size
                new_width = int(width * (max_size / height))
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        output = BytesIO()
        img.save(output, format="JPEG", quality=95)
        return output.getvalue()

    @staticmethod
    def encode_image(image_bytes: bytes) -> str:
        """Base64-encode raw image bytes."""
        return base64.b64encode(image_bytes).decode("utf-8")

    @staticmethod
    def get_media_type(image_bytes: bytes) -> str:
        """Detect the MIME type of an image from its magic bytes."""
        if image_bytes[:3] == b"\xff\xd8\xff":
            return "image/jpeg"
        if image_bytes[:8] == b"\x89PNG\r\n\x1a\n":
            return "image/png"
        if image_bytes[:4] == b"GIF8":
            return "image/gif"
        if image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP":
            return "image/webp"
        return "image/jpeg"
