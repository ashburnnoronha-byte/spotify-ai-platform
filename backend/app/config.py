from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AI Music Intelligence Platform"
    debug: bool = False
    api_prefix: str = "/api/v1"

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/spotify_ai"

    @field_validator("database_url", mode="before")
    @classmethod
    def ensure_asyncpg_scheme(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        if value.startswith("postgres://"):
            return "postgresql+asyncpg://" + value[len("postgres://") :]
        if value.startswith("postgresql://"):
            return "postgresql+asyncpg://" + value[len("postgresql://") :]
        return value

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Security
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    token_encryption_key: str = "change-me-32-byte-fernet-key-base64=="
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Spotify OAuth
    spotify_client_id: str = ""
    spotify_client_secret: str = ""
    spotify_redirect_uri: str = "http://127.0.0.1:8000/api/v1/auth/callback"
    spotify_scopes: str = (
        "user-read-private user-read-email "
        "user-top-read user-read-recently-played "
        "playlist-read-private playlist-read-collaborative "
        "user-library-read user-follow-read"
    )

    # CORS
    frontend_url: str = "http://127.0.0.1:5173"
    cors_origins: list[str] = ["http://127.0.0.1:5173", "http://localhost:5173"]

    # AI / RAG
    llm_provider: str = "gemini"
    google_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash-lite"
    openai_api_key: str = ""
    llm_model: str = "gpt-4o-mini"
    embedding_model: str = "text-embedding-3-small"
    use_openai_embeddings: bool = False
    chroma_persist_dir: str = "./.chroma"

    @property
    def spotify_authorize_url(self) -> str:
        return "https://accounts.spotify.com/authorize"

    @property
    def spotify_token_url(self) -> str:
        return "https://accounts.spotify.com/api/token"

    @property
    def spotify_api_base(self) -> str:
        return "https://api.spotify.com/v1"


@lru_cache
def get_settings() -> Settings:
    return Settings()
