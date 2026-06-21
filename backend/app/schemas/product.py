import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, field_validator


class ProductBase(BaseModel):
    name: str
    description: str | None = None
    price: Decimal
    category: str
    brand: str | None = None
    sizes: list[str] = []
    color: str | None = None
    occasions: list[str] = []
    stock: int = 0

    @field_validator("occasions", "sizes", mode="before")
    @classmethod
    def coerce_null_to_empty(cls, v: object) -> list:
        return v if v is not None else []


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    category: str | None = None
    sizes: list[str] | None = None
    color: str | None = None
    occasions: list[str] | None = None
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
