"""
VLM Service - Vision Language Model integration for coin identification.

Supports:
- Google Gemini (direct SDK for better accuracy)
- OpenAI GPT-4 Vision (via LiteLLM)
- Anthropic Claude 3 (via LiteLLM)
"""

import base64
import json
import os
import re
from typing import Optional

import litellm
from PIL import Image
from io import BytesIO

from ..models.coin import Coin


class VLMService:
    """Service for coin identification using Vision Language Models."""
    
    # Prompt template for coin identification
    COIN_IDENTIFICATION_PROMPT = """Carefully analyze this image of coin(s). 

IMPORTANT: First read ALL text inscribed on the coin(s) - this is critical for accurate identification.
Look for country names, year, denomination, and any other inscriptions visible on the coin.

For each coin visible, identify and provide the following information:

1. name: Name of the coin (e.g., "5 Forint", "Quarter Dollar", "1 Euro")
2. country: Country of origin - MUST match the text on the coin (e.g., if you see "MAGYARORSZÁG", the country is Hungary)
3. year: Year minted (read from the coin if visible)
4. denomination: Face value denomination as text (e.g., "5 forint", "25 cents", "1 euro")
5. face_value: Numeric face value as a decimal number
6. currency: Currency code (e.g., "HUF" for Hungarian Forint, "USD", "EUR", "GBP")
7. obverse_description: Brief description of the front side including any text visible
8. reverse_description: Brief description of the back side including any text visible
9. confidence: Your confidence in this identification from 0.0 to 1.0

Return ONLY a valid JSON array of objects with these fields. No additional text or explanation.
If no coins are visible, return an empty array: []

Example response format:
[
  {
    "name": "5 Forint",
    "country": "Hungary",
    "year": 2017,
    "denomination": "5 forint",
    "face_value": 5.0,
    "currency": "HUF",
    "obverse_description": "Great Egret bird with text MAGYARORSZÁG",
    "reverse_description": "Large numeral 5 with text FORINT",
    "confidence": 0.95
  }
]"""

    def __init__(self, model: Optional[str] = None):
        """
        Initialize VLM Service.
        
        Args:
            model: VLM model to use. Defaults to VLM_MODEL env var.
        """
        self.model = model or os.getenv("VLM_MODEL", "gemini-2.0-flash")
        self.use_gemini_sdk = self.model.startswith("gemini") and not self.model.startswith("gemini/")
        
        # Configure based on provider
        if self.use_gemini_sdk:
            self._init_gemini()
        else:
            litellm.set_verbose = os.getenv("DEBUG", "false").lower() == "true"
    
    def _init_gemini(self):
        """Initialize Gemini SDK."""
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        genai.configure(api_key=api_key)
        self.genai = genai
    
    def _resize_image(self, image_bytes: bytes, max_size: int = 1280) -> bytes:
        """Resize image to fit within max dimensions while preserving aspect ratio.
        
        Uses 1280px max to conserve API tokens while preserving coin text details.
        """
        img = Image.open(BytesIO(image_bytes))
        
        # Get original dimensions
        width, height = img.size
        
        # Only resize if image is larger than max_size
        if width > max_size or height > max_size:
            # Calculate new dimensions preserving aspect ratio
            if width > height:
                new_width = max_size
                new_height = int(height * (max_size / width))
            else:
                new_height = max_size
                new_width = int(width * (max_size / height))
            
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Convert to RGB if necessary (for JPEG output)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # Save to bytes with high quality to preserve text details
        output = BytesIO()
        img.save(output, format='JPEG', quality=95)
        return output.getvalue()
    
    def _encode_image(self, image_bytes: bytes) -> str:
        """Encode image bytes to base64 string."""
        return base64.b64encode(image_bytes).decode("utf-8")
    
    def _get_image_media_type(self, image_bytes: bytes) -> str:
        """Detect image media type from bytes."""
        # Check magic bytes
        if image_bytes[:3] == b'\xff\xd8\xff':
            return "image/jpeg"
        elif image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
            return "image/png"
        elif image_bytes[:4] == b'GIF8':
            return "image/gif"
        elif image_bytes[:4] == b'RIFF' and image_bytes[8:12] == b'WEBP':
            return "image/webp"
        else:
            # Default to JPEG
            return "image/jpeg" 
    
    def _parse_json_response(self, response_text: str) -> list[dict]:
        """Extract and parse JSON from VLM response."""
        # Remove markdown code blocks if present
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            # Remove opening code block (```json or ```)
            cleaned = re.sub(r'^```\w*\n?', '', cleaned)
            # Remove closing code block
            cleaned = re.sub(r'\n?```$', '', cleaned)
        
        # Try to find JSON array in the response
        json_match = re.search(r'\[[\s\S]*\]', cleaned)
        
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
        
        # Try parsing the whole response
        try:
            result = json.loads(cleaned)
            if isinstance(result, list):
                return result
            elif isinstance(result, dict) and "coins" in result:
                return result["coins"]
        except json.JSONDecodeError:
            pass
        
        return []
    
    async def identify_coins(self, image_bytes: bytes) -> tuple[list[Coin], str]:
        """
        Identify coins in an image using the configured VLM.
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            Tuple of (list of identified Coin objects, model name used)
        """
        # Resize image if too large (keeps under API limits)
        processed_bytes = self._resize_image(image_bytes, max_size=2048)
        
        if self.use_gemini_sdk:
            response_text = await self._call_gemini_sdk(processed_bytes)
        else:
            response_text = await self._call_litellm(processed_bytes)
        
        # Parse JSON response
        coins_data = self._parse_json_response(response_text)
        
        # Convert to Coin objects
        coins = []
        for coin_data in coins_data:
            try:
                coin = Coin(
                    name=coin_data.get("name", "Unknown"),
                    country=coin_data.get("country", "Unknown"),
                    year=coin_data.get("year"),
                    denomination=coin_data.get("denomination", "Unknown"),
                    face_value=coin_data.get("face_value"),
                    currency=coin_data.get("currency", "Unknown"),
                    obverse_description=coin_data.get("obverse_description"),
                    reverse_description=coin_data.get("reverse_description"),
                    confidence=float(coin_data.get("confidence", 0.5))
                )
                coins.append(coin)
            except Exception:
                # Skip malformed coin data
                continue
        
        return coins, self.model
    
    async def _call_gemini_sdk(self, image_bytes: bytes) -> str:
        """Call Gemini API directly using the SDK for better accuracy."""
        import asyncio
        
        # Create PIL Image for Gemini SDK
        img = Image.open(BytesIO(image_bytes))
        
        # Get the model
        model = self.genai.GenerativeModel(self.model)
        
        # Generate content with image - run in thread pool since SDK is synchronous
        def _generate():
            response = model.generate_content(
                [self.COIN_IDENTIFICATION_PROMPT, img],
                generation_config=self.genai.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=4000,
                )
            )
            return response.text
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _generate)
    
    async def _call_litellm(self, image_bytes: bytes) -> str:
        """Call VLM via LiteLLM (for OpenAI, Anthropic, etc.)."""
        # Encode image to base64
        image_b64 = self._encode_image(image_bytes)
        media_type = "image/jpeg"  # Always JPEG after resize
        data_url = f"data:{media_type};base64,{image_b64}"
        
        # Construct message with image using OpenAI-compatible format
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": self.COIN_IDENTIFICATION_PROMPT
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": data_url
                        }
                    }
                ]
            }
        ]
        
        # Call VLM via LiteLLM with retry for transient failures
        max_retries = 3
        last_error = None
        
        for attempt in range(max_retries):
            try:
                response = await litellm.acompletion(
                    model=self.model,
                    messages=messages,
                    max_tokens=4000,
                    temperature=0.1
                )
                
                if response.choices and response.choices[0].message.content:
                    return response.choices[0].message.content
            except Exception as e:
                last_error = e
                if attempt < max_retries - 1:
                    import asyncio
                    await asyncio.sleep(2)
                    continue
                raise
        
        if last_error:
            raise last_error
        return "[]"

