from pydantic import Field
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "Twiniky"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/twiniky"

    # Sin valor por defecto a propósito: cualquier clave escrita aquí quedaría pública en GitHub.
    # Si faltan en .env el servidor no arranca. Generar con:
    #   python -c "import secrets; print(secrets.token_urlsafe(48))"
    SECRET_KEY: str = Field(min_length=32)
    BRAND_SECRET_KEY: str = Field(min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 14  # 14 days

    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "twiniky-assets"
    AWS_REGION: str = "us-east-1"

    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "onboarding@resend.dev"
    FRONTEND_URL: str = "http://localhost:3000"

    AVATAR_SDK_CLIENT_ID: str = ""
    AVATAR_SDK_CLIENT_SECRET: str = ""
    AVATAR_SDK_BASE_URL: str = "https://api.avatarsdk.com"
    AVATAR_SDK_PIPELINE: str = "body_0.3"

    SEGMIND_API_KEY: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
