import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.schemas.order import CheckoutCreate, OrderCreate, OrderOut
from app.services.product import ProductService

router = APIRouter()


@router.get("/", response_model=list[OrderOut])
async def list_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Order).where(Order.buyer_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/checkout", response_model=list[OrderOut], status_code=status.HTTP_201_CREATED)
async def checkout(
    payload: CheckoutCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="El carrito está vacío")

    created: list[Order] = []

    products = ProductService(db)
    for item in payload.items:
        product = await products.reserve_stock(item.product_id, item.quantity)

        order = Order(
            buyer_id=current_user.id,
            product_id=item.product_id,
            quantity=item.quantity,
            size=item.size,
            total_price=product.price * item.quantity,
            status=OrderStatus.PENDING,
            shipping_address=payload.shipping_address,
        )
        db.add(order)
        created.append(order)

    await db.commit()
    for o in created:
        await db.refresh(o)

    return created


@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = await ProductService(db).reserve_stock(payload.product_id, payload.quantity)

    order = Order(
        buyer_id=current_user.id,
        product_id=payload.product_id,
        quantity=payload.quantity,
        size=payload.size,
        total_price=product.price * payload.quantity,
        status=OrderStatus.PENDING,
        shipping_address=payload.shipping_address,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.buyer_id == current_user.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return order
