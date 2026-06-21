from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.waitlist import WaitlistEmail

router = APIRouter()


class WaitlistJoin(BaseModel):
    email: EmailStr


class WaitlistOut(BaseModel):
    message: str


@router.post("/", response_model=WaitlistOut, status_code=status.HTTP_201_CREATED)
async def join_waitlist(payload: WaitlistJoin, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(WaitlistEmail).where(WaitlistEmail.email == payload.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este email ya está en la lista de espera.",
        )
    db.add(WaitlistEmail(email=payload.email))
    await db.commit()
    return WaitlistOut(message="¡Listo! Te avisamos cuando el probador 3D esté disponible.")
