import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.brands import get_current_brand
from app.db.session import get_db
from app.models.brand import Brand
from app.models.product import Product
from app.schemas.brand import BrandProductCreate
from app.schemas.product import ProductOut, ProductUpdate
from app.services.product import ProductService

router = APIRouter()


@router.get("/", response_model=list[ProductOut])
async def list_products(
    category: str | None = Query(None),
    q: str | None = Query(None),
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    return await ProductService(db).list_products(category=category, q=q, skip=skip, limit=limit)


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
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_brand: Brand = Depends(get_current_brand),
):
    product = await ProductService(db).get_or_404(product_id)
    if product.brand_id != current_brand.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puedes eliminar productos de otra marca.")
    await db.delete(product)
    await db.commit()
