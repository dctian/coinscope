"""
Prompt construction for coin identification requests.

Centralises the system prompt so it can be reused across providers and
easily updated without touching provider code.
"""


class PromptBuilder:
    """Builds the coin identification prompt."""

    TEMPLATE = """Carefully analyze this image of coin(s).

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
10. bbox: Bounding box of the coin in the ORIGINAL IMAGE as normalized
    [x_min, y_min, x_max, y_max] with values between 0.0 and 1.0.
    x_min/y_min is top-left, x_max/y_max is bottom-right.

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
    "confidence": 0.95,
    "bbox": [0.12, 0.18, 0.42, 0.58]
  }
]"""

    @classmethod
    def build(cls) -> str:
        """Return the full coin identification prompt."""
        return cls.TEMPLATE
