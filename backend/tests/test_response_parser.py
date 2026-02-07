"""Tests for app.services.response_parser.ResponseParser."""

import json

import pytest

from app.services.response_parser import ResponseParser
from app.models.coin import Coin


class TestParseJsonResponse:
    """Tests for ResponseParser.parse_json_response."""

    def test_valid_json_array(self, sample_coin_data: list[dict]):
        """Parsing a well-formed JSON array should succeed."""
        raw = json.dumps(sample_coin_data)
        result = ResponseParser.parse_json_response(raw)
        assert isinstance(result, list)
        assert len(result) == 2
        assert result[0]["name"] == "Lincoln Penny"

    def test_markdown_wrapped_json(self, sample_coin_data: list[dict]):
        """JSON wrapped in markdown code fences should be parsed correctly."""
        raw = "```json\n" + json.dumps(sample_coin_data) + "\n```"
        result = ResponseParser.parse_json_response(raw)
        assert len(result) == 2

    def test_markdown_no_lang_hint(self, sample_coin_data: list[dict]):
        """Markdown code fences without a language hint should still work."""
        raw = "```\n" + json.dumps(sample_coin_data) + "\n```"
        result = ResponseParser.parse_json_response(raw)
        assert len(result) == 2

    def test_nested_coins_key(self, sample_coin_data: list[dict]):
        """A wrapper object with a 'coins' key should be unwrapped."""
        raw = json.dumps({"coins": sample_coin_data})
        result = ResponseParser.parse_json_response(raw)
        assert len(result) == 2

    def test_malformed_json_returns_empty_list(self):
        """Completely invalid JSON should return an empty list."""
        result = ResponseParser.parse_json_response("this is not json at all {{{")
        assert result == []

    def test_empty_string_returns_empty_list(self):
        """An empty string should return an empty list."""
        result = ResponseParser.parse_json_response("")
        assert result == []

    def test_empty_array(self):
        """An empty JSON array should return an empty list."""
        result = ResponseParser.parse_json_response("[]")
        assert result == []

    def test_json_with_surrounding_text(self):
        """JSON array embedded in surrounding text should be extracted."""
        raw = 'Here are the coins I found:\n[{"name": "Penny"}]\nHope this helps!'
        result = ResponseParser.parse_json_response(raw)
        assert len(result) == 1
        assert result[0]["name"] == "Penny"


class TestParseCoins:
    """Tests for ResponseParser.parse_coins."""

    def test_valid_coins(self, sample_coin_data: list[dict]):
        """Valid coin dicts should produce Coin model instances."""
        coins = ResponseParser.parse_coins(sample_coin_data)
        assert len(coins) == 2
        assert all(isinstance(c, Coin) for c in coins)
        assert coins[0].name == "Lincoln Penny"
        assert coins[1].country == "Canada"

    def test_missing_optional_fields(self):
        """Coins with missing optional fields should still parse."""
        data = [
            {
                "name": "Mystery Coin",
                "country": "Unknown",
                "denomination": "Unknown",
                "currency": "USD",
                "confidence": 0.5,
            }
        ]
        coins = ResponseParser.parse_coins(data)
        assert len(coins) == 1
        assert coins[0].year is None
        assert coins[0].face_value is None
        assert coins[0].obverse_description is None
        assert coins[0].bbox is None

    def test_year_range_string_extracts_first_year(self):
        """A year given as a range string (e.g. '2010-2015') should extract a number."""
        data = [
            {
                "name": "Some Coin",
                "country": "US",
                "year": "2010-2015",
                "denomination": "1 dollar",
                "currency": "USD",
                "confidence": 0.7,
            }
        ]
        coins = ResponseParser.parse_coins(data)
        assert len(coins) == 1
        assert coins[0].year == 2010

    def test_year_text_with_circa(self):
        """Year like 'circa 1890' should extract the numeric part."""
        data = [
            {
                "name": "Old Coin",
                "country": "UK",
                "year": "circa 1890",
                "denomination": "1 penny",
                "currency": "GBP",
                "confidence": 0.6,
            }
        ]
        coins = ResponseParser.parse_coins(data)
        assert coins[0].year == 1890

    def test_bbox_parsed(self, sample_coin_data: list[dict]):
        """Bounding box should be parsed as a list of 4 floats."""
        coins = ResponseParser.parse_coins(sample_coin_data)
        assert coins[0].bbox == [0.1, 0.2, 0.5, 0.6]

    def test_bbox_invalid_length_ignored(self):
        """A bbox with wrong length should be set to None."""
        data = [
            {
                "name": "Coin",
                "country": "US",
                "denomination": "1c",
                "currency": "USD",
                "confidence": 0.5,
                "bbox": [0.1, 0.2],
            }
        ]
        coins = ResponseParser.parse_coins(data)
        assert coins[0].bbox is None

    def test_bbox_non_numeric_ignored(self):
        """A bbox with non-numeric values should be set to None."""
        data = [
            {
                "name": "Coin",
                "country": "US",
                "denomination": "1c",
                "currency": "USD",
                "confidence": 0.5,
                "bbox": ["a", "b", "c", "d"],
            }
        ]
        coins = ResponseParser.parse_coins(data)
        assert coins[0].bbox is None

    def test_malformed_entry_skipped(self):
        """An entry that causes an exception should be skipped."""
        data = [
            {
                "name": "Good Coin",
                "country": "US",
                "denomination": "1c",
                "currency": "USD",
                "confidence": 0.9,
            },
            {
                # confidence is required and must be a float;
                # a non-convertible value should cause the entry to be skipped
                "name": "Bad Coin",
                "country": "US",
                "denomination": "1c",
                "currency": "USD",
                "confidence": "not-a-number",
            },
        ]
        coins = ResponseParser.parse_coins(data)
        # The good coin should survive; the bad one should be skipped
        assert len(coins) >= 1
        assert coins[0].name == "Good Coin"

    def test_defaults_for_missing_name(self):
        """Missing name should default to 'Unknown'."""
        data = [
            {
                "country": "US",
                "denomination": "1c",
                "currency": "USD",
                "confidence": 0.5,
            }
        ]
        coins = ResponseParser.parse_coins(data)
        assert coins[0].name == "Unknown"
