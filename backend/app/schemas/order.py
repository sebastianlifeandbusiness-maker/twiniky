import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.order import OrderStatus


class OrderCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = 1
    size: str | None = None
    shipping_address: str


class CheckoutItem(BaseModel):
    product_id: uuid.UUID
    quantity: int = 1
    size: str | None = None


class CheckoutCreate(BaseModel):
    items: list[CheckoutItem]
    shipping_address: str  # JSON-encoded contact + address


class OrderOut(BaseModel):
    id: uuid.UUID
    buyer_id: uuid.UUID | None
    product_id: uuid.UUID
    quantity: int
    size: str | None
    total_price: Decimal
    status: OrderStatus
    shipping_address: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class BrandOrderOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    quantity: int
    size: str | None
    total_price: Decimal
    status: OrderStatus
    shipping_address: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
