import json

from fastapi import APIRouter, Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_optional_user
from app.db.session import get_db
from app.models.brand import Brand
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.order import CheckoutCreate, OrderOut
from app.services.email import send_email
from app.services.email_templates import brand_order_notification_email, buyer_confirmation_email

router = APIRouter()

_BRAND_SECRET = "twiniky-brands-secret-2026"
_BRAND_ALGORITHM = "HS256"


def _brand_id_from_token(token: str | None) -> str | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, _BRAND_SECRET, algorithms=[_BRAND_ALGORITHM])
        if payload.get("type") == "brand":
            return payload.get("sub")
    except JWTError:
        pass
    return None


@router.post("/", response_model=list[OrderOut], status_code=status.HTTP_201_CREATED)
async def checkout(
    payload: CheckoutCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
    x_brand_token: str | None = Header(None),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="El carrito está vacío")

    acting_brand_id = _brand_id_from_token(x_brand_token)

    created: list[Order] = []
    order_products: list[Product] = []

    for item in payload.items:
        result = await db.execute(select(Product).where(Product.id == item.product_id))
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Producto {item.product_id} no encontrado",
            )

        if acting_brand_id and product.brand_id and str(product.brand_id) == acting_brand_id:
            raise HTTPException(
                status_code=403,
                detail=f"No puedes comprar productos de tu propia marca.",
            )

        order = Order(
            buyer_id=current_user.id if current_user else None,
            product_id=item.product_id,
            quantity=item.quantity,
            size=item.size,
            total_price=product.price * item.quantity,
            status=OrderStatus.PENDING,
            shipping_address=payload.shipping_address,
        )
        db.add(order)
        created.append(order)
        order_products.append(product)

    await db.commit()
    for o in created:
        await db.refresh(o)

    await _send_order_emails(db, current_user, payload.shipping_address, list(zip(created, order_products)))

    return created


def _parse_shipping_address(raw: str) -> dict:
    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        return {}


async def _send_order_emails(
    db: AsyncSession,
    current_user: User | None,
    shipping_address_raw: str,
    order_products: list[tuple[Order, Product]],
) -> None:
    shipping_address = _parse_shipping_address(shipping_address_raw)
    buyer_email = current_user.email if current_user else shipping_address.get("email")

    if buyer_email:
        buyer_items = [
            {"name": product.name, "size": order.size, "quantity": order.quantity, "price": order.total_price}
            for order, product in order_products
        ]
        first_order = order_products[0][0]
        total = sum((order.total_price for order, _ in order_products), start=first_order.total_price * 0)
        await send_email(
            to=buyer_email,
            subject="¡Tu pedido en Twiniky está confirmado! 🛍️",
            html=buyer_confirmation_email(
                order_number=str(first_order.id),
                items=buyer_items,
                total=total,
                shipping_address=shipping_address,
            ),
        )

    brand_ids = {product.brand_id for _, product in order_products if product.brand_id}
    brands_by_id: dict = {}
    if brand_ids:
        result = await db.execute(select(Brand).where(Brand.id.in_(brand_ids)))
        brands_by_id = {b.id: b for b in result.scalars().all()}

    for order, product in order_products:
        if not product.brand_id:
            continue
        brand = brands_by_id.get(product.brand_id)
        if not brand:
            continue
        await send_email(
            to=brand.email,
            subject="¡Nuevo pedido recibido en Twiniky! 📦",
            html=brand_order_notification_email(
                order_number=str(order.id),
                product_name=product.name,
                size=order.size,
                quantity=order.quantity,
                price=order.total_price,
                shipping_address=shipping_address,
            ),
        )
