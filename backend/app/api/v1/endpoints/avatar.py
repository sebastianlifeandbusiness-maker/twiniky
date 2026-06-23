from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.avatar import AvatarMeasurements
from app.models.user import User
from app.schemas.avatar import AvatarMeasurementsIn, AvatarMeasurementsOut

router = APIRouter()


@router.get("/measurements", response_model=AvatarMeasurementsOut)
async def get_measurements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AvatarMeasurements).where(AvatarMeasurements.user_id == current_user.id)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No avatar measurements found")
    return row


@router.post("/measurements", response_model=AvatarMeasurementsOut)
async def upsert_measurements(
    payload: AvatarMeasurementsIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AvatarMeasurements).where(AvatarMeasurements.user_id == current_user.id)
    )
    row = result.scalar_one_or_none()

    if row is None:
        row = AvatarMeasurements(user_id=current_user.id, **payload.model_dump())
        db.add(row)
    else:
        for field, value in payload.model_dump().items():
            setattr(row, field, value)

    await db.commit()
    await db.refresh(row)
    return row
