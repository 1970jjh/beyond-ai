"""Test configuration - patch settings before any app imports."""
import os
import sys
from unittest.mock import MagicMock

# Set required env vars before any app module is imported
os.environ.setdefault("BEYOND_JWT_SECRET_KEY", "test-secret-key-for-unit-tests-only-32chars!")
os.environ.setdefault("BEYOND_GEMINI_API_KEY", "test-gemini-key")
os.environ.setdefault("BEYOND_CLAUDE_API_KEY", "test-claude-key")

# Stub out database module so tests that import models don't need a real DB
_db_stub = MagicMock()
_db_stub.Base = type("Base", (), {})
sys.modules.setdefault("app.core.database", _db_stub)
