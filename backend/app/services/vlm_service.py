"""
VLM Service - Multi-provider Vision Language Model integration.

Supports:
- OpenAI GPT-4 Vision (via LiteLLM)
- Google Gemini Pro Vision (via google-generativeai SDK)
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

# Import Google Generative AI SDK for direct Gemini access
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class VLMService:
    """Service for coin identification using Vision Language Models via LiteLLM."""
    
    # Prompt template for coin identification
    COIN_IDENTIFICATION_PROMPT = """Carefully analyze this image of coin(s). 

IMPORTANT: First read ALL text inscribed on the coin(s) - this is critical for accurate identification.
Look for country names, year, denomination, and any other inscriptions.

For each coin visible, identify and provide the following information:

1. name: Name of the coin (e.g., "Canadian Quarter", "Quarter Dollar", "1 Euro")
2. country: Country of origin (e.g., "Canada", "United States", "Europe")
3. year: Year minted (read from the coin if visible)
4. denomination: Face value denomination as text (e.g., "25 cents", "25 cents", "1 euro")
5. face_value: Numeric face value as a decimal number
6. currency: Currency code (e.g., "CAD" for Canadian, "USD", "EUR", "GBP", etc)
7. obverse_description: Brief description of the front side including any text visible
8. reverse_description: Brief description of the back side including any text visible
9. confidence: Your confidence in this identification from 0.0 to 1.0

Return ONLY a valid JSON array of objects with these fields. No additional text or explanation.
If no coins are visible, return an empty array: []

Example response format:
[
  {
    "name": "Canadian Quarter",
    "country": "Canada",
    "year": 2017,
    "denomination": "25 cents",
    "face_value": 0.25,
    "currency": "CAD",
    "obverse_description": "Queen Elizabeth II with text CANADA",
    "reverse_description": "Denomination 25 with text CENTS",
    "confidence": 0.95
  }
]"""

    def __init__(self, model: Optional[str] = None):
        """
        Initialize VLM Service.
        
        Args:
            model: VLM model to use. Defaults to VLM_MODEL env var or gpt-4-vision-preview.
        """
        self.model = model or os.getenv("VLM_MODEL", "gemini/gemini-flash-latest")
        
        # Configure LiteLLM
        litellm.set_verbose = os.getenv("DEBUG", "false").lower() == "true"
        
        # Configure Google Generative AI if using Gemini
        if GENAI_AVAILABLE and self._is_gemini_model():
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                genai.configure(api_key=api_key)
    
    def _is_gemini_model(self) -> bool:
        """Check if the configured model is a Gemini model."""
        return "gemini" in self.model.lower()
    
    def _get_gemini_model_name(self) -> str:
        """Extract the Gemini model name from the configured model string."""
        # Handle formats like "gemini/gemini-flash-latest" or "gemini-flash-latest"
        model = self.model
        if model.startswith("gemini/"):
            model = model[7:]  # Remove "gemini/" prefix
        return model
    
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
    
    async def _call_gemini_directly(self, image_bytes: bytes) -> str:
        """Call Gemini API directly using google-generativeai SDK."""
        import asyncio
        
        model_name = self._get_gemini_model_name()
        model = genai.GenerativeModel(model_name)
        
        # Create image part from bytes
        image_part = {
            "mime_type": "image/jpeg",
            "data": image_bytes
        }
        
        # Generate content with image and prompt
        def sync_generate():
            response = model.generate_content(
                [self.COIN_IDENTIFICATION_PROMPT, image_part],
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=4000,
                )
            )
            return response.text
        
        # Run synchronous call in executor
        loop = asyncio.get_event_loop()
        response_text = await loop.run_in_executor(None, sync_generate)
        
        return response_text
    
    async def identify_coins(self, image_bytes: bytes) -> tuple[list[Coin], str]:
        """
        Identify coins in an image using the configured VLM.
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            Tuple of (list of identified Coin objects, model name used)
        """
        import asyncio
        
        # Resize image if too large (keeps under API limits)
        processed_bytes = self._resize_image(image_bytes, max_size=2048)
        
        # Use Gemini SDK directly for Gemini models (better image handling)
        if GENAI_AVAILABLE and self._is_gemini_model():
            max_retries = 3
            last_error = None
            
            for attempt in range(max_retries):
                try:
                    response_text = await self._call_gemini_directly(processed_bytes)
                    break
                except Exception as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        await asyncio.sleep(2)
                        continue
                    raise
            else:
                if last_error:
                    raise last_error
        else:
            # Use LiteLLM for other providers (OpenAI, Anthropic, etc.)
            image_b64 = self._encode_image(processed_bytes)
            media_type = "image/jpeg"
            data_url = f"data:{media_type};base64,{image_b64}"
            
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
                        break
                except Exception as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        await asyncio.sleep(2)
                        continue
                    raise
            else:
                if last_error:
                    raise last_error
            
            response_text = response.choices[0].message.content
        
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

