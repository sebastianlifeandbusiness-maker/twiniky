import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.avatar import AvatarMeasurements
from app.models.product import Product
from app.models.user import User
from app.services.avatar_sdk import UPLOAD_DIR as AVATAR_UPLOAD_DIR
from app.services.idm_vton import TryOnError, generate_tryon
from app.services.tryon import TryOnService

router = APIRouter()


class VirtualTryOnRequest(BaseModel):
    product_id: uuid.UUID


class VirtualTryOnResponse(BaseModel):
    image_base64: str


@router.post("/virtual-tryon", response_model=VirtualTryOnResponse)
async def virtual_tryon(
    payload: VirtualTryOnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    avatar_result = await db.execute(
        select(AvatarMeasurements).where(AvatarMeasurements.user_id == current_user.id)
    )
    avatar_row = avatar_result.scalar_one_or_none()
    if avatar_row is None or not avatar_row.selfie_photo_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sube tu foto en Configurar Avatar para usar esta función.",
        )

    product_result = await db.execute(select(Product).where(Product.id == payload.product_id))
    product = product_result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")
    if not product.image_urls:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="El producto no tiene imagen."
        )

    user_photo_path = AVATAR_UPLOAD_DIR / str(current_user.id) / Path(avatar_row.selfie_photo_url).name

    try:
        image_base64 = await generate_tryon(
            user_photo_path,
            product.image_urls[0],
            product.description or product.name,
        )
    except TryOnError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    return VirtualTryOnResponse(image_base64=image_base64)


@router.post("/session")
async def create_tryon_session(
    product_id: uuid.UUID,
    user_photo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TryOnService(db).create_session(product_id, user_photo)


@router.get("/session/{session_id}")
async def get_tryon_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await TryOnService(db).get_session(session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada.")
    return session


@router.post("/upload-photos")
async def upload_photos(
    frontal: UploadFile = File(...),
    perfil_izq: UploadFile = File(...),
    perfil_der: UploadFile = File(...),
    espalda: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TryOnService(db).save_photos(
        current_user.id,
        [frontal, perfil_izq, perfil_der, espalda],
    )
