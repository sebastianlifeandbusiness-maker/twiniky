import uuid

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.tryon import TryOnService

router = APIRouter()


@router.post("/session")
async def create_tryon_session(
    product_id: uuid.UUID,
    user_photo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload a user photo and receive a 3D try-on session for the given product."""
    return await TryOnService(db).create_session(product_id, user_photo)


@router.get("/session/{session_id}")
async def get_tryon_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await TryOnService(db).get_session(session_id)
