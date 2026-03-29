from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Beyond AI Backend"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/beyond_ai"
    database_url_sync: str = "postgresql://postgres:postgres@localhost:5432/beyond_ai"
    redis_url: str = "redis://localhost:6379/0"

    # Google Apps Script Web API
    gas_web_url: str = ""
    gas_api_key: str = ""

    # Google Sheets (direct reference)
    sheets_spreadsheet_id: str = ""

    # Google OAuth2 (user login only - Sheets access via GAS)
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:5173/auth/callback"

    # JWT (self-issued session tokens)
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 7

    @field_validator("jwt_secret_key")
    @classmethod
    def jwt_secret_must_be_set(cls, v: str) -> str:
        if not v or v == "change-me-in-production":
            raise ValueError(
                "BEYOND_JWT_SECRET_KEY must be set to a strong secret. "
                "Do not use the default value."
            )
        return v

    # AI providers
    gemini_api_key: str = ""
    claude_api_key: str = ""

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://beyond-ai-ten.vercel.app",
    ]

    model_config = {"env_prefix": "BEYOND_", "env_file": ".env"}


settings = Settings()
