from fastapi import APIRouter, Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_optional_user
from app.db.session import get_db
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.order import CheckoutCreate, OrderOut

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

    await db.commit()
    for o in created:
        await db.refresh(o)

    return created
