import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.favorite import Favorite
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductOut

router = APIRouter()


@router.get("/", response_model=list[ProductOut])
async def list_favorites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Product)
        .join(Favorite, Favorite.product_id == Product.id)
        .where(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{product_id}", status_code=status.HTTP_201_CREATED)
async def add_favorite(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exists = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
    if not exists:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")

    already = (await db.execute(
        select(Favorite).where(Favorite.user_id == current_user.id, Favorite.product_id == product_id)
    )).scalar_one_or_none()
    if already:
        raise HTTPException(status_code=409, detail="Ya está en tus favoritos.")

    db.add(Favorite(user_id=current_user.id, product_id=product_id))
    await db.commit()
    return {"message": "Agregado a favoritos."}


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fav = (await db.execute(
        select(Favorite).where(Favorite.user_id == current_user.id, Favorite.product_id == product_id)
    )).scalar_one_or_none()
    if not fav:
        raise HTTPException(status_code=404, detail="No encontrado en favoritos.")
    await db.delete(fav)
    await db.commit()
