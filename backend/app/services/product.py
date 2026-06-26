import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.schemas.product import ProductCreate


class ProductService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_404(self, product_id: uuid.UUID) -> Product:
        result = await self.db.execute(select(Product).where(Product.id == product_id))
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Product not found")
        return product

    async def list_products(
        self,
        category: str | None,
        q: str | None,
        skip: int,
        limit: int,
        brand_id: uuid.UUID | None = None,
    ) -> list[Product]:
        query = select(Product)
        if brand_id:
            query = query.where(Product.brand_id == brand_id)
        if category:
            query = query.where(Product.category == category)
        if q:
            query = query.where(Product.name.ilike(f"%{q}%"))
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, seller_id: uuid.UUID, payload: ProductCreate) -> Product:
        product = Product(**payload.model_dump(), seller_id=seller_id)
        self.db.add(product)
        await self.db.commit()
        await self.db.refresh(product)
        return product
