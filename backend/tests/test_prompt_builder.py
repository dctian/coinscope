"""Tests for app.services.prompt_builder.PromptBuilder."""

from app.services.prompt_builder import PromptBuilder


class TestPromptBuilder:
    """Tests for the PromptBuilder.build() class method."""

    def test_build_returns_nonempty_string(self):
        """build() must return a non-empty string."""
        result = PromptBuilder.build()
        assert isinstance(result, str)
        assert len(result) > 0

    def test_prompt_mentions_coin(self):
        """The prompt should reference coins."""
        result = PromptBuilder.build()
        assert "coin" in result.lower()

    def test_prompt_mentions_json(self):
        """The prompt should ask for JSON output."""
        result = PromptBuilder.build()
        assert "JSON" in result

    def test_prompt_mentions_expected_fields(self):
        """The prompt should list all expected response fields."""
        result = PromptBuilder.build()
        for field in [
            "name",
            "country",
            "year",
            "denomination",
            "face_value",
            "currency",
            "confidence",
            "bbox",
        ]:
            assert field in result, f"Missing expected field '{field}' in prompt"

    def test_prompt_mentions_bounding_box(self):
        """The prompt should describe the bounding-box format."""
        result = PromptBuilder.build()
        assert "x_min" in result
        assert "y_min" in result

    def test_build_idempotent(self):
        """Calling build() multiple times should return the same string."""
        assert PromptBuilder.build() == PromptBuilder.build()
