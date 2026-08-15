from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.avatar import AvatarMeasurements
from app.models.user import User
from app.schemas.avatar import AvatarMeasurementsIn, AvatarMeasurementsOut
from app.services.avatar_sdk import AvatarSDKError, generate_avatar_for_user, get_access_token, get_avatar_status

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


@router.post("/generate", response_model=AvatarMeasurementsOut)
async def generate_avatar(
    photo: UploadFile = File(...),
    height: float = Form(...),
    bust: float = Form(...),
    waist: float = Form(...),
    hips: float = Form(...),
    shoulder_width: float = Form(...),
    torso_length: float = Form(...),
    leg_length: float = Form(...),
    arm_length: float = Form(...),
    arm_girth: float = Form(...),
    thigh_girth: float = Form(...),
    calf_girth: float = Form(...),
    shoe_size: float = Form(...),
    sex: str | None = Form(None),
    age_group: str | None = Form(None),
    body_type: str | None = Form(None),
    weight: float | None = Form(None),
    skin_tone: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    measurements = AvatarMeasurementsIn(
        height=height, bust=bust, waist=waist, hips=hips,
        shoulder_width=shoulder_width, torso_length=torso_length, leg_length=leg_length,
        arm_length=arm_length, arm_girth=arm_girth, thigh_girth=thigh_girth, calf_girth=calf_girth,
        shoe_size=shoe_size, sex=sex, age_group=age_group, body_type=body_type,
        weight=weight, skin_tone=skin_tone,
    )

    photo_bytes = await photo.read()
    if not photo_bytes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Foto vacía.")

    pipeline_subtype = "male" if sex == "male" else "female"

    try:
        glb_url = await generate_avatar_for_user(
            current_user.id, photo_bytes, photo.filename or "selfie.jpg", pipeline_subtype
        )
    except AvatarSDKError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    result = await db.execute(
        select(AvatarMeasurements).where(AvatarMeasurements.user_id == current_user.id)
    )
    row = result.scalar_one_or_none()

    if row is None:
        row = AvatarMeasurements(user_id=current_user.id, **measurements.model_dump())
        db.add(row)
    else:
        for field, value in measurements.model_dump().items():
            setattr(row, field, value)

    row.avatar_glb_url = glb_url

    await db.commit()
    await db.refresh(row)
    return row


@router.get("/status/{avatar_code}")
async def avatar_status(
    avatar_code: str,
    current_user: User = Depends(get_current_user),
):
    try:
        access_token = await get_access_token()
        avatar_status_value = await get_avatar_status(access_token, avatar_code)
    except AvatarSDKError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return {"avatar_code": avatar_code, "status": avatar_status_value}


@router.get("/model")
async def get_avatar_model(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AvatarMeasurements).where(AvatarMeasurements.user_id == current_user.id)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No avatar found")
    return {"avatar_glb_url": row.avatar_glb_url}
