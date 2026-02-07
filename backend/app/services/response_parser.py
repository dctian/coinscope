"""
Response parsing for VLM coin identification output.

Extracts structured JSON from raw model responses and converts the data
into validated Coin model instances.
"""

import json
import logging
import re
from typing import Optional

from ..models.coin import Coin

logger = logging.getLogger(__name__)


class ResponseParser:
    """Parses raw VLM text into Coin objects."""

    @staticmethod
    def parse_json_response(response_text: str) -> list[dict]:
        """Extract a JSON array from a VLM response string.

        Handles markdown code fences, bare JSON, and wrapper objects.
        """
        cleaned = response_text.strip()

        # Strip markdown code fences
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```\w*\n?", "", cleaned)
            cleaned = re.sub(r"\n?```$", "", cleaned)

        # Try to locate a JSON array
        json_match = re.search(r"\[[\s\S]*\]", cleaned)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

        # Fallback: parse the whole string
        try:
            result = json.loads(cleaned)
            if isinstance(result, list):
                return result
            if isinstance(result, dict) and "coins" in result:
                return result["coins"]
        except json.JSONDecodeError:
            pass

        return []

    @staticmethod
    def parse_coins(coins_data: list[dict]) -> list[Coin]:
        """Convert raw dicts into validated Coin instances.

        Malformed entries are logged and skipped.
        """
        coins: list[Coin] = []
        for entry in coins_data:
            try:
                year_value: Optional[int] = entry.get("year")
                if isinstance(year_value, str):
                    year_match = re.search(r"\d{3,4}", year_value)
                    year_value = int(year_match.group()) if year_match else None

                # Parse bbox if present
                raw_bbox = entry.get("bbox")
                bbox: Optional[list[float]] = None
                if isinstance(raw_bbox, list) and len(raw_bbox) == 4:
                    try:
                        bbox = [float(v) for v in raw_bbox]
                    except (TypeError, ValueError):
                        bbox = None

                coin = Coin(
                    name=entry.get("name", "Unknown"),
                    country=entry.get("country", "Unknown"),
                    year=year_value,
                    denomination=entry.get("denomination", "Unknown"),
                    face_value=entry.get("face_value"),
                    currency=entry.get("currency", "Unknown"),
                    obverse_description=entry.get("obverse_description"),
                    reverse_description=entry.get("reverse_description"),
                    confidence=float(entry.get("confidence", 0.5)),
                    bbox=bbox,
                )
                coins.append(coin)
            except Exception:
                logger.warning("Skipping malformed coin entry: %s", entry)
                continue
        return coins
