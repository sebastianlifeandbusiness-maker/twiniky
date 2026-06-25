import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.guest_stock_alert import GuestStockAlert
from app.models.product import Product
from app.models.stock_alert import StockAlert
from app.models.user import User

router = APIRouter()


class StockAlertCreate(BaseModel):
    product_id: str
    size: str


class StockAlertOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    size: str
    is_active: bool
    created_at: datetime
    notified_at: datetime | None
    product_name: str | None
    product_image: str | None
    product_brand: str | None

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[StockAlertOut])
async def list_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(StockAlert, Product)
        .outerjoin(Product, StockAlert.product_id == Product.id)
        .where(StockAlert.user_id == current_user.id)
        .where(StockAlert.is_active.is_(True))
        .order_by(StockAlert.created_at.desc())
    )
    rows = result.all()
    return [
        StockAlertOut(
            id=alert.id,
            product_id=alert.product_id,
            size=alert.size,
            is_active=alert.is_active,
            created_at=alert.created_at,
            notified_at=alert.notified_at,
            product_name=product.name if product else None,
            product_image=product.image_urls[0] if product and product.image_urls else None,
            product_brand=product.brand if product else None,
        )
        for alert, product in rows
    ]


@router.post("/", response_model=StockAlertOut, status_code=status.HTTP_201_CREATED)
async def create_alert(
    payload: StockAlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        product_id = uuid.UUID(payload.product_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="product_id invalido.")

    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")

    result = await db.execute(
        select(StockAlert)
        .where(StockAlert.user_id == current_user.id)
        .where(StockAlert.product_id == product_id)
        .where(StockAlert.size == payload.size)
    )
    existing = result.scalar_one_or_none()

    if existing:
        if existing.is_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"message": "Ya tienes una alerta activa para esta talla.", "alert_id": str(existing.id)},
            )
        existing.is_active = True
        existing.notified_at = None
        await db.commit()
        alert = existing
    else:
        alert = StockAlert(
            id=uuid.uuid4(),
            user_id=current_user.id,
            product_id=product_id,
            size=payload.size,
            created_at=datetime.now(timezone.utc),
        )
        db.add(alert)
        await db.commit()

    return StockAlertOut(
        id=alert.id,
        product_id=alert.product_id,
        size=alert.size,
        is_active=True,
        created_at=alert.created_at,
        notified_at=None,
        product_name=product.name,
        product_image=product.image_urls[0] if product.image_urls else None,
        product_brand=product.brand,
    )


class GuestAlertCreate(BaseModel):
    email: str
    product_id: str
    size: str


class GuestAlertOut(BaseModel):
    message: str
    email: str


@router.post("/guest", response_model=GuestAlertOut, status_code=status.HTTP_201_CREATED)
async def create_guest_alert(
    payload: GuestAlertCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        product_id = uuid.UUID(payload.product_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="product_id invalido.")

    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")

    email = payload.email.lower().strip()

    # Si el email pertenece a un usuario registrado → crear StockAlert vinculada a su cuenta
    user_result = await db.execute(select(User).where(User.email == email))
    registered_user = user_result.scalar_one_or_none()

    if registered_user:
        alert_result = await db.execute(
            select(StockAlert)
            .where(StockAlert.user_id == registered_user.id)
            .where(StockAlert.product_id == product_id)
            .where(StockAlert.size == payload.size)
        )
        existing = alert_result.scalar_one_or_none()
        if existing:
            if existing.is_active:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={"message": "Ya tienes una alerta activa para esta talla.", "alert_id": str(existing.id)},
                )
            existing.is_active = True
            existing.notified_at = None
        else:
            db.add(StockAlert(
                id=uuid.uuid4(),
                user_id=registered_user.id,
                product_id=product_id,
                size=payload.size,
                created_at=datetime.now(timezone.utc),
            ))
        await db.commit()
        return GuestAlertOut(message=f"Te avisaremos a {email} cuando vuelva a estar disponible.", email=email)

    # Email no registrado → GuestStockAlert
    guest_result = await db.execute(
        select(GuestStockAlert)
        .where(GuestStockAlert.email == email)
        .where(GuestStockAlert.product_id == product_id)
        .where(GuestStockAlert.size == payload.size)
    )
    existing_guest = guest_result.scalar_one_or_none()

    if existing_guest:
        if existing_guest.is_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"message": "Ya tienes una alerta activa para esta talla."},
            )
        existing_guest.is_active = True
        existing_guest.notified_at = None
    else:
        db.add(GuestStockAlert(
            id=uuid.uuid4(),
            email=email,
            product_id=product_id,
            size=payload.size,
            created_at=datetime.now(timezone.utc),
        ))

    await db.commit()
    return GuestAlertOut(message=f"Te avisaremos a {email} cuando vuelva a estar disponible.", email=email)


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_alert(
    alert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(StockAlert)
        .where(StockAlert.id == alert_id)
        .where(StockAlert.user_id == current_user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta no encontrada.")
    alert.is_active = False
    await db.commit()
