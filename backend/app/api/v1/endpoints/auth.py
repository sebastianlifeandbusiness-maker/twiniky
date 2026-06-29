from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user, oauth2_scheme
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import LoginRequest, Token, UserCreate, UserOut
from app.services.auth import AuthService

router = APIRouter()

REFRESH_THRESHOLD_S = 7 * 24 * 3600  # renovar si quedan < 7 días


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    return await AuthService(db).register(payload)


@router.post("/login", response_model=Token)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await AuthService(db).login(payload.email, payload.password)


@router.post("/refresh", response_model=Token)
async def refresh_token(
    raw_token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_user),
):
    try:
        payload = jwt.decode(raw_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        exp = payload.get("exp")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    if exp is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sin expiración")

    remaining = exp - datetime.now(timezone.utc).timestamp()
    if remaining < REFRESH_THRESHOLD_S:
        return Token(access_token=create_access_token(subject=str(current_user.id)))
    return Token(access_token=raw_token)
