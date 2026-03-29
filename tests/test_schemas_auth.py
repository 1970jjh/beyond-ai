"""Tests for app.schemas.auth - password validation"""
import pytest
from pydantic import ValidationError

from app.schemas.auth import RegisterRequest


VALID_BASE = {
    "tenant_slug": "jj-corp",
    "email": "test@example.com",
    "display_name": "테스트 사용자",
}


class TestPasswordValidation:
    def _make(self, password: str) -> RegisterRequest:
        return RegisterRequest(**VALID_BASE, password=password)

    def test_valid_strong_password(self):
        req = self._make("Str0ng!Pass")
        assert req.password == "Str0ng!Pass"

    def test_too_short_raises(self):
        with pytest.raises(ValidationError) as exc:
            self._make("Sh0rt!")
        assert "8자" in str(exc.value)

    def test_no_uppercase_raises(self):
        with pytest.raises(ValidationError) as exc:
            self._make("nouppercase1!")
        assert "대문자" in str(exc.value)

    def test_no_lowercase_raises(self):
        with pytest.raises(ValidationError) as exc:
            self._make("NOLOWERCASE1!")
        assert "소문자" in str(exc.value)

    def test_no_digit_raises(self):
        with pytest.raises(ValidationError) as exc:
            self._make("NoDigitHere!")
        assert "숫자" in str(exc.value)

    def test_no_special_char_raises(self):
        with pytest.raises(ValidationError) as exc:
            self._make("NoSpecial1A")
        assert "특수문자" in str(exc.value)

    def test_exactly_8_chars_valid(self):
        req = self._make("Aa1!aaaa")
        assert req.password == "Aa1!aaaa"

    def test_invalid_email_raises(self):
        with pytest.raises(ValidationError):
            RegisterRequest(
                tenant_slug="jj-corp",
                email="not-an-email",
                display_name="테스트",
                password="Valid1!Pw",
            )

    @pytest.mark.parametrize("special", ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", ",", "."])
    def test_various_special_chars_accepted(self, special: str):
        req = self._make(f"ValidPass1{special}")
        assert req.password.endswith(special)
