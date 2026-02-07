"""Tests for app.models.coin Pydantic models."""

import pytest
from pydantic import ValidationError

from app.models.coin import Coin, CoinIdentificationResponse


class TestCoinModel:
    """Tests for the Coin Pydantic model."""

    def test_valid_coin(self):
        """A coin with all required fields should be valid."""
        coin = Coin(
            name="Quarter Dollar",
            country="United States",
            denomination="25 cents",
            currency="USD",
            confidence=0.95,
        )
        assert coin.name == "Quarter Dollar"
        assert coin.country == "United States"
        assert coin.confidence == 0.95
        # Auto-generated id
        assert coin.id is not None and len(coin.id) > 0

    def test_optional_fields_default_to_none(self):
        """Optional fields should default to None."""
        coin = Coin(
            name="Penny",
            country="US",
            denomination="1 cent",
            currency="USD",
            confidence=0.5,
        )
        assert coin.year is None
        assert coin.face_value is None
        assert coin.obverse_description is None
        assert coin.reverse_description is None
        assert coin.bbox is None

    def test_all_fields_populated(self):
        """A coin with every field should round-trip correctly."""
        coin = Coin(
            name="Euro",
            country="Europe",
            year=2020,
            denomination="1 euro",
            face_value=1.0,
            currency="EUR",
            obverse_description="Map of Europe",
            reverse_description="Denomination",
            confidence=0.99,
            bbox=[0.1, 0.2, 0.8, 0.9],
        )
        assert coin.year == 2020
        assert coin.face_value == 1.0
        assert coin.bbox == [0.1, 0.2, 0.8, 0.9]

    def test_confidence_lower_bound(self):
        """Confidence must be >= 0."""
        with pytest.raises(ValidationError):
            Coin(
                name="Coin",
                country="US",
                denomination="1c",
                currency="USD",
                confidence=-0.1,
            )

    def test_confidence_upper_bound(self):
        """Confidence must be <= 1."""
        with pytest.raises(ValidationError):
            Coin(
                name="Coin",
                country="US",
                denomination="1c",
                currency="USD",
                confidence=1.5,
            )

    def test_confidence_at_boundaries(self):
        """Confidence exactly 0 and exactly 1 should be accepted."""
        coin_zero = Coin(
            name="Coin", country="US", denomination="1c", currency="USD", confidence=0.0
        )
        coin_one = Coin(
            name="Coin", country="US", denomination="1c", currency="USD", confidence=1.0
        )
        assert coin_zero.confidence == 0.0
        assert coin_one.confidence == 1.0

    def test_missing_required_field_raises(self):
        """Omitting a required field should raise ValidationError."""
        with pytest.raises(ValidationError):
            Coin(
                # name is missing
                country="US",
                denomination="1c",
                currency="USD",
                confidence=0.5,
            )

    def test_id_auto_generated_unique(self):
        """Each Coin should get a unique auto-generated id."""
        c1 = Coin(name="A", country="US", denomination="1c", currency="USD", confidence=0.5)
        c2 = Coin(name="B", country="US", denomination="1c", currency="USD", confidence=0.5)
        assert c1.id != c2.id

    def test_bbox_field_accepts_list_of_floats(self):
        """bbox should accept a list of 4 floats."""
        coin = Coin(
            name="Coin",
            country="US",
            denomination="1c",
            currency="USD",
            confidence=0.5,
            bbox=[0.0, 0.0, 1.0, 1.0],
        )
        assert coin.bbox == [0.0, 0.0, 1.0, 1.0]


class TestCoinIdentificationResponse:
    """Tests for CoinIdentificationResponse."""

    def test_valid_response(self):
        """A response with coins should be valid."""
        coin = Coin(
            name="Penny",
            country="US",
            denomination="1 cent",
            currency="USD",
            confidence=0.9,
        )
        resp = CoinIdentificationResponse(
            coins=[coin],
            total_coins_detected=1,
            model_used="gemini/gemini-flash-latest",
        )
        assert resp.total_coins_detected == 1
        assert len(resp.coins) == 1
        assert resp.model_used == "gemini/gemini-flash-latest"

    def test_empty_coins(self):
        """A response with no coins should be valid."""
        resp = CoinIdentificationResponse(
            coins=[],
            total_coins_detected=0,
            model_used="test-model",
        )
        assert resp.coins == []
        assert resp.total_coins_detected == 0

    def test_missing_total_raises(self):
        """Omitting total_coins_detected should raise ValidationError."""
        with pytest.raises(ValidationError):
            CoinIdentificationResponse(
                coins=[],
                model_used="test",
            )

    def test_missing_model_raises(self):
        """Omitting model_used should raise ValidationError."""
        with pytest.raises(ValidationError):
            CoinIdentificationResponse(
                coins=[],
                total_coins_detected=0,
            )
