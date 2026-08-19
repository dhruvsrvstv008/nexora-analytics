from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Required — no defaults. Missing either at startup raises ValidationError immediately.
    DATABASE_URL: str
    SECRET_KEY: str

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENVIRONMENT: str = "development"

    # Comma-separated list of allowed CORS origins.
    # Local default covers the Vite dev server; override in production with the
    # Netlify site URL, e.g. CORS_ORIGINS=https://nexora.netlify.app
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
