from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "Roamwise AI API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Groq Settings
    GROQ_API_KEY: str = Field(default="", description="API Key for Groq Cloud")
    GROQ_MODEL: str = Field(default="llama-3.3-70b-versatile", description="Model name for Groq LLM")
    GROQ_MAX_RETRIES: int = 2
    GROQ_TIMEOUT_SECONDS: float = 60.0

    # Supabase Settings
    SUPABASE_URL: str = Field(default="", description="Supabase project URL")
    SUPABASE_KEY: str = Field(default="", description="Supabase anon or service role key")
    SUPABASE_JWT_SECRET: str = Field(default="", description="JWT secret for token verification")

    # CORS Settings
    FRONTEND_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.FRONTEND_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
