import os

from pydantic_settings import BaseSettings
from typing import List

# TEMP DEBUG — quitar después de diagnosticar
print(f"[Config] CWD: {os.getcwd()}")
print(f"[Config] .env path: {os.path.abspath('.env')}")
print(f"[Config] AVATAR_SDK_CLIENT_ID: {os.environ.get('AVATAR_SDK_CLIENT_ID', 'NO ENCONTRADO')}")


class Settings(BaseSettings):
    PROJECT_NAME: str = "Twiniky"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/twiniky"

    SECRET_KEY: str = "changeme-secret-key"
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

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# TEMP DEBUG — quitar después de diagnosticar
print(f"[Config] settings.AVATAR_SDK_CLIENT_ID (tal como quedó en el objeto Settings): {settings.AVATAR_SDK_CLIENT_ID!r}")
print(f"[Config] ¿existe el archivo en esa ruta?: {os.path.isfile(os.path.abspath('.env'))}")
