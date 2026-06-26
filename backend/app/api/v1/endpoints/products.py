import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete as sa_delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.brands import get_current_brand
from app.db.session import get_db
from app.models.brand import Brand
from app.models.guest_stock_alert import GuestStockAlert
from app.models.product import Product
from app.models.stock_alert import StockAlert
from app.models.tryon_selection import TryOnSelection
from app.models.user import User
from app.schemas.brand import BrandProductCreate
from app.schemas.product import ProductOut, ProductUpdate
from app.services.email import send_stock_notification
from app.services.product import ProductService

router = APIRouter()


@router.get("/", response_model=list[ProductOut])
async def list_products(
    category: str | None = Query(None),
    q: str | None = Query(None),
    brand_id: uuid.UUID | None = Query(None),
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    return await ProductService(db).list_products(
        category=category, q=q, skip=skip, limit=limit, brand_id=brand_id
    )


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await ProductService(db).get_or_404(product_id)


@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: BrandProductCreate,
    db: AsyncSession = Depends(get_db),
    current_brand: Brand = Depends(get_current_brand),
):
    product = Product(
        brand_id=current_brand.id,
        brand=current_brand.name,
        name=payload.name,
        description=payload.description,
        price=payload.price,
        category=payload.category,
        sizes=payload.sizes,
        color=payload.color,
        occasions=payload.occasions,
        image_urls=[payload.image_url] if payload.image_url else [],
        stock=payload.stock,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_brand: Brand = Depends(get_current_brand),
):
    product = await ProductService(db).get_or_404(product_id)
    if product.brand_id != current_brand.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puedes editar productos de otra marca.")
    old_stock = product.stock
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    if payload.stock is not None and old_stock == 0 and payload.stock > 0:
        await _notify_stock_alerts(db, product)
    return product


async def _notify_stock_alerts(db: AsyncSession, product: Product) -> None:
    now = datetime.now(timezone.utc)

    # Alertas de usuarios registrados
    user_result = await db.execute(
        select(StockAlert, User)
        .join(User, StockAlert.user_id == User.id)
        .where(StockAlert.product_id == product.id)
        .where(StockAlert.is_active.is_(True))
    )
    for alert, user in user_result.all():
        alert.is_active = False
        alert.notified_at = now
        await send_stock_notification(user_email=user.email, product_name=product.name, size=alert.size)

    # Alertas de invitados
    guest_result = await db.execute(
        select(GuestStockAlert)
        .where(GuestStockAlert.product_id == product.id)
        .where(GuestStockAlert.is_active.is_(True))
    )
    for guest_alert in guest_result.scalars().all():
        guest_alert.is_active = False
        guest_alert.notified_at = now
        await send_stock_notification(user_email=guest_alert.email, product_name=product.name, size=guest_alert.size)

    await db.commit()


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_brand: Brand = Depends(get_current_brand),
):
    product = await ProductService(db).get_or_404(product_id)
    if product.brand_id != current_brand.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puedes eliminar productos de otra marca.")
    await db.execute(sa_delete(TryOnSelection).where(TryOnSelection.product_id == product_id))
    await db.delete(product)
    await db.commit()
