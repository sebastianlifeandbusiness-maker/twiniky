import uuid
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Query, status, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.db.session import get_db
from app.models.brand import Brand
from app.models.order import Order
from app.models.product import Product
from app.schemas.brand import BrandCreate, BrandOut, BrandProductCreate, BrandLogin, BrandToken
from app.schemas.order import BrandOrderOut
from app.schemas.product import ProductOut

router = APIRouter()

SECRET_KEY = "twiniky-brands-secret-2026"
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def create_brand_token(brand_id: str, brand_name: str) -> str:
    expire = datetime.utcnow() + timedelta(days=30)
    return jwt.encode(
        {"sub": brand_id, "name": brand_name, "type": "brand", "exp": expire},
        SECRET_KEY, algorithm=ALGORITHM
    )

async def get_current_brand(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
) -> Brand:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token de marca requerido.")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "brand":
            raise HTTPException(status_code=401, detail="Token inválido.")
        brand_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")
    result = await db.execute(select(Brand).where(Brand.id == uuid.UUID(brand_id)))
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada.")
    return brand

@router.post("/register", response_model=BrandOut, status_code=status.HTTP_201_CREATED)
async def register_brand(payload: BrandCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Brand).where(Brand.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Este email ya está registrado como marca.")
    hashed = hash_password(payload.password)
    brand = Brand(
        name=payload.name,
        email=payload.email,
        hashed_password=hashed,
        logo_url=payload.logo_url,
        description=payload.description,
    )
    db.add(brand)
    await db.commit()
    await db.refresh(brand)
    return brand

@router.post("/login", response_model=BrandToken)
async def login_brand(payload: BrandLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Brand).where(Brand.email == payload.email))
    brand = result.scalar_one_or_none()
    if not brand or not verify_password(payload.password, brand.hashed_password):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos.")
    token = create_brand_token(str(brand.id), brand.name)
    return BrandToken(
        access_token=token,
        token_type="bearer",
        brand_id=str(brand.id),
        brand_name=brand.name
    )

@router.get("/", response_model=list[BrandOut])
async def list_brands(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Brand).order_by(Brand.created_at.desc()))
    return result.scalars().all()

@router.get("/by-email", response_model=BrandOut)
async def get_brand_by_email(
    email: str = Query(...),
    db: AsyncSession = Depends(get_db),
    current_brand: Brand = Depends(get_current_brand),
):
    result = await db.execute(select(Brand).where(Brand.email == email))
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada.")
    return brand

@router.get("/me", response_model=BrandOut)
async def get_my_brand(current_brand: Brand = Depends(get_current_brand)):
    return current_brand

@router.get("/{brand_id}", response_model=BrandOut)
async def get_brand(brand_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada.")
    return brand

@router.post("/{brand_id}/products/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def add_brand_product(
    brand_id: uuid.UUID,
    payload: BrandProductCreate,
    db: AsyncSession = Depends(get_db),
    current_brand: Brand = Depends(get_current_brand),
):
    if current_brand.id != brand_id:
        raise HTTPException(status_code=403, detail="No puedes agregar productos a otra marca.")
    product = Product(
        brand_id=brand_id,
        name=payload.name,
        description=payload.description,
        price=payload.price,
        category=payload.category,
        brand=current_brand.name,
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

@router.get("/{brand_id}/products/", response_model=list[ProductOut])
async def list_brand_products(brand_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).where(Product.brand_id == brand_id).order_by(Product.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{brand_id}/orders/", response_model=list[BrandOrderOut])
async def list_brand_orders(
    brand_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_brand: Brand = Depends(get_current_brand),
):
    if current_brand.id != brand_id:
        raise HTTPException(status_code=403, detail="No puedes ver pedidos de otra marca.")
    result = await db.execute(
        select(Order)
        .join(Product, Order.product_id == Product.id)
        .where(Product.brand_id == brand_id)
        .options(selectinload(Order.product))
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    return [
        BrandOrderOut(
            id=o.id,
            product_id=o.product_id,
            product_name=o.product.name if o.product else "—",
            quantity=o.quantity,
            size=o.size,
            total_price=o.total_price,
            status=o.status,
            shipping_address=o.shipping_address,
            created_at=o.created_at,
        )
        for o in orders
    ]