import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.guest_stock_alert import GuestStockAlert
from app.models.stock_alert import StockAlert
from app.models.user import User
from app.schemas.user import Token, UserCreate


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, payload: UserCreate) -> User:
        existing = await self.db.execute(select(User).where(User.email == payload.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status.HTTP_409_CONFLICT, detail="Email already registered")

        user = User(
            email=payload.email,
            full_name=payload.full_name,
            hashed_password=hash_password(payload.password),
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        # Migrar alertas de invitado al nuevo usuario
        guest_result = await self.db.execute(
            select(GuestStockAlert)
            .where(GuestStockAlert.email == payload.email.lower().strip())
            .where(GuestStockAlert.is_active.is_(True))
        )
        for guest_alert in guest_result.scalars().all():
            self.db.add(StockAlert(
                id=uuid.uuid4(),
                user_id=user.id,
                product_id=guest_alert.product_id,
                size=guest_alert.size,
                created_at=datetime.now(timezone.utc),
            ))
            guest_alert.is_active = False
        await self.db.commit()

        return user

    async def login(self, email: str, password: str) -> Token:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user or not user.is_active or not verify_password(password, user.hashed_password):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        token = create_access_token(subject=str(user.id))
        return Token(access_token=token)
