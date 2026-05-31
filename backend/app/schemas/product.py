import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class ProductBase(BaseModel):
    name: str
    description: str | None = None
    price: Decimal
    category: str
    brand: str | None = None
    sizes: list[str] = []
    stock: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    category: str | None = None
    sizes: list[str] | None = None
    stock: int | None = None
    model_3d_url: str | None = None


class ProductOut(ProductBase):
    id: uuid.UUID
    seller_id: uuid.UUID | None
    brand_id: uuid.UUID | None = None
    image_urls: list[str]
    model_3d_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
