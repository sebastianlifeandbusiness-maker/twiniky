import uuid
import bcrypt
from collections import defaultdict
from datetime import datetime, date as date_cls, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status, Header
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from jose import jwt, JWTError
from app.db.session import get_db
from app.models.brand import Brand
from app.models.brand_tryon_selection import BrandTryOnSelection
from app.models.guest_stock_alert import GuestStockAlert
from app.models.order import Order
from app.models.product import Product
from app.models.stock_alert import StockAlert
from app.schemas.brand import BrandCreate, BrandOut, BrandProductCreate, BrandLogin, BrandToken
from app.schemas.order import BrandOrderOut
from app.schemas.product import ProductOut

router = APIRouter()

# ── Inline schemas para endpoints /me/* ──────────────────────────────────────

class TopProductOut(BaseModel):
    name: str
    quantity: int

class SalesByMonthOut(BaseModel):
    month: str
    total: float

class BrandStatsOut(BaseModel):
    total_orders: int
    total_revenue: float
    total_products: int
    top_products: list[TopProductOut]
    sales_by_month: list[SalesByMonthOut]

class StockAlertBySizeOut(BaseModel):
    size: str
    count: int

class ProductStockAlertOut(BaseModel):
    product_id: str
    product_name: str
    product_image: str | None
    sizes_waiting: list[StockAlertBySizeOut]
    total_waiting: int

class BrandProfileUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    logo_url: str | None = None

class BrandCredentialsUpdate(BaseModel):
    email: str | None = None
    current_password: str
    new_password: str | None = None

SECRET_KEY = "twiniky-brands-secret-2026"
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

BRAND_REFRESH_THRESHOLD_S = 3.5 * 24 * 3600  # renovar si quedan < 3.5 días

def create_brand_token(brand_id: str, brand_name: str) -> str:
    expire = datetime.utcnow() + timedelta(days=7)
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

@router.post("/refresh", response_model=BrandToken)
async def refresh_brand_token(
    authorization: str | None = Header(None),
    current_brand: Brand = Depends(get_current_brand),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    raw_token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(raw_token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = payload.get("exp")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    if exp is None:
        raise HTTPException(status_code=401, detail="Token sin expiración")

    remaining = exp - datetime.now(timezone.utc).timestamp()
    new_token = (
        create_brand_token(str(current_brand.id), current_brand.name)
        if remaining < BRAND_REFRESH_THRESHOLD_S
        else raw_token
    )
    return BrandToken(
        access_token=new_token,
        token_type="bearer",
        brand_id=str(current_brand.id),
        brand_name=current_brand.name,
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


@router.get("/me/stats", response_model=BrandStatsOut)
async def get_brand_stats(
    current_brand: Brand = Depends(get_current_brand),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order, Product.name.label("pname"))
        .join(Product, Order.product_id == Product.id)
        .where(Product.brand_id == current_brand.id)
    )
    rows = result.all()

    total_orders = len(rows)
    total_revenue = sum(float(str(row.Order.total_price)) for row in rows)

    count_res = await db.execute(
        select(func.count(Product.id)).where(Product.brand_id == current_brand.id)
    )
    total_products = count_res.scalar_one() or 0

    product_qty: dict[str, int] = defaultdict(int)
    monthly: dict[str, float] = defaultdict(float)
    for row in rows:
        product_qty[row.pname or "Sin nombre"] += row.Order.quantity
        if row.Order.created_at:
            key = row.Order.created_at.strftime("%b %Y")
            monthly[key] += float(str(row.Order.total_price))

    top = sorted(product_qty.items(), key=lambda x: x[1], reverse=True)[:3]
    top_products = [TopProductOut(name=n, quantity=q) for n, q in top]

    now = datetime.now(timezone.utc)
    sales_by_month = []
    for i in range(5, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        key = date_cls(y, m, 1).strftime("%b %Y")
        sales_by_month.append(SalesByMonthOut(month=key, total=round(monthly.get(key, 0))))

    return BrandStatsOut(
        total_orders=total_orders,
        total_revenue=round(total_revenue),
        total_products=total_products,
        top_products=top_products,
        sales_by_month=sales_by_month,
    )


@router.get("/me/stock-alerts", response_model=list[ProductStockAlertOut])
async def get_brand_stock_alerts(
    current_brand: Brand = Depends(get_current_brand),
    db: AsyncSession = Depends(get_db),
):
    prod_res = await db.execute(select(Product).where(Product.brand_id == current_brand.id))
    products = prod_res.scalars().all()
    if not products:
        return []
    product_map = {p.id: p for p in products}
    product_ids = list(product_map.keys())

    reg_res = await db.execute(
        select(StockAlert)
        .where(StockAlert.product_id.in_(product_ids))
        .where(StockAlert.is_active.is_(True))
    )
    guest_res = await db.execute(
        select(GuestStockAlert)
        .where(GuestStockAlert.product_id.in_(product_ids))
        .where(GuestStockAlert.is_active.is_(True))
    )

    alert_counts: dict[uuid.UUID, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for a in reg_res.scalars().all():
        alert_counts[a.product_id][a.size] += 1
    for a in guest_res.scalars().all():
        alert_counts[a.product_id][a.size] += 1

    items = []
    for product_id, size_counts in alert_counts.items():
        p = product_map.get(product_id)
        if not p:
            continue
        items.append(ProductStockAlertOut(
            product_id=str(product_id),
            product_name=p.name,
            product_image=p.image_urls[0] if p.image_urls else None,
            sizes_waiting=[StockAlertBySizeOut(size=s, count=c) for s, c in sorted(size_counts.items())],
            total_waiting=sum(size_counts.values()),
        ))
    return sorted(items, key=lambda x: x.total_waiting, reverse=True)


@router.patch("/me/profile", response_model=BrandOut)
async def update_brand_profile(
    payload: BrandProfileUpdate,
    current_brand: Brand = Depends(get_current_brand),
    db: AsyncSession = Depends(get_db),
):
    if payload.name is not None:
        current_brand.name = payload.name
    if payload.description is not None:
        current_brand.description = payload.description
    if "logo_url" in payload.model_fields_set:
        current_brand.logo_url = payload.logo_url
    await db.commit()
    await db.refresh(current_brand)
    return current_brand


@router.patch("/me/credentials", response_model=BrandOut)
async def update_brand_credentials(
    payload: BrandCredentialsUpdate,
    current_brand: Brand = Depends(get_current_brand),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(payload.current_password, current_brand.hashed_password):
        raise HTTPException(status_code=400, detail="Contrasena actual incorrecta.")
    if payload.email:
        dup = await db.execute(
            select(Brand).where(Brand.email == payload.email).where(Brand.id != current_brand.id)
        )
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Este email ya esta registrado.")
        current_brand.email = payload.email
    if payload.new_password:
        current_brand.hashed_password = hash_password(payload.new_password)
    await db.commit()
    await db.refresh(current_brand)
    return current_brand


ALL_ZONES = ["upper", "lower", "dress", "shoes", "accessories"]

class ZoneSelectionOut(BaseModel):
    zone: str
    product_id: str | None
    name: str | None
    image_url: str | None
    category: str | None
    color: str | None
    brand: str | None
    price: str | None
    selected_color: str | None

class TryOnSelectionIn(BaseModel):
    product_id: str
    selected_color: str | None = None


@router.get("/me/tryon-selections", response_model=list[ZoneSelectionOut])
async def get_brand_tryon_selections(
    current_brand: Brand = Depends(get_current_brand),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BrandTryOnSelection, Product)
        .outerjoin(Product, BrandTryOnSelection.product_id == Product.id)
        .where(BrandTryOnSelection.brand_id == current_brand.id)
    )
    rows = {sel.zone: (sel, prod) for sel, prod in result.all()}
    out = []
    for zone in ALL_ZONES:
        if zone in rows and rows[zone][1] is not None:
            sel, prod = rows[zone]
            out.append(ZoneSelectionOut(
                zone=zone,
                product_id=str(prod.id),
                name=prod.name,
                image_url=prod.image_urls[0] if prod.image_urls else None,
                category=prod.category,
                color=prod.color,
                brand=prod.brand,
                price=str(prod.price),
                selected_color=sel.selected_color,
            ))
        else:
            out.append(ZoneSelectionOut(
                zone=zone, product_id=None, name=None,
                image_url=None, category=None, color=None,
                brand=None, price=None, selected_color=None,
            ))
    return out


@router.put("/me/tryon-selections/{zone}", response_model=ZoneSelectionOut)
async def update_brand_tryon_selection(
    zone: str,
    payload: TryOnSelectionIn,
    current_brand: Brand = Depends(get_current_brand),
    db: AsyncSession = Depends(get_db),
):
    if zone not in ALL_ZONES:
        raise HTTPException(status_code=400, detail="Zona inválida.")
    try:
        product_id = uuid.UUID(payload.product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="product_id inválido.")
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    result = await db.execute(
        select(BrandTryOnSelection)
        .where(BrandTryOnSelection.brand_id == current_brand.id)
        .where(BrandTryOnSelection.zone == zone)
    )
    sel = result.scalar_one_or_none()
    if sel:
        sel.product_id = product_id
        sel.selected_color = payload.selected_color
    else:
        sel = BrandTryOnSelection(
            id=uuid.uuid4(),
            brand_id=current_brand.id,
            zone=zone,
            product_id=product_id,
            selected_color=payload.selected_color,
        )
        db.add(sel)
    await db.commit()
    return ZoneSelectionOut(
        zone=zone,
        product_id=str(product.id),
        name=product.name,
        image_url=product.image_urls[0] if product.image_urls else None,
        category=product.category,
        color=product.color,
        brand=product.brand,
        price=str(product.price),
        selected_color=payload.selected_color,
    )


@router.delete("/me/tryon-selections/{zone}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brand_tryon_selection(
    zone: str,
    current_brand: Brand = Depends(get_current_brand),
    db: AsyncSession = Depends(get_db),
):
    if zone not in ALL_ZONES:
        raise HTTPException(status_code=400, detail="Zona inválida.")
    result = await db.execute(
        select(BrandTryOnSelection)
        .where(BrandTryOnSelection.brand_id == current_brand.id)
        .where(BrandTryOnSelection.zone == zone)
    )
    sel = result.scalar_one_or_none()
    if sel:
        await db.delete(sel)
        await db.commit()


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