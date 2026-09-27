from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./triagekey.db"
    database_direct_url: str | None = None
    gemini_api_key: str | None = None
    cors_origins: str = "http://localhost:5173"
    environment: str = "development"
    api_docs_enabled: bool = True
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("cors_origins")
    @classmethod
    def no_wildcard_cors(cls, value: str) -> str:
        if "*" in value:
            raise ValueError("CORS_ORIGINS must list trusted origins; wildcard CORS is forbidden")
        return value

    @model_validator(mode="after")
    def production_requires_postgres(self):
        if self.environment == "production" and not self.database_url.startswith("postgresql"):
            raise ValueError("Production requires a PostgreSQL DATABASE_URL")
        return self


settings = Settings()
