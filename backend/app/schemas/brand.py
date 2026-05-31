import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, EmailStr

class BrandCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    logo_url: str | None = None
    description: str | None = None

class BrandLogin(BaseModel):
    email: EmailStr
    password: str

class BrandToken(BaseModel):
    access_token: str
    token_type: str
    brand_id: str
    brand_name: str

class BrandOut(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    logo_url: str | None
    description: str | None
    created_at: datetime
    model_config = {"from_attributes": True}

class BrandProductCreate(BaseModel):
    name: str
    description: str | None = None
    price: Decimal
    category: str
    sizes: list[str] = []
    image_url: str | None = None
    stock: int = 0