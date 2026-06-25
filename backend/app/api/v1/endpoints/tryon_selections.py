import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.product import Product
from app.models.tryon_selection import TryOnSelection
from app.models.user import User

router = APIRouter()

ALL_ZONES = ["upper", "lower", "dress", "shoes", "accessories"]


class TryOnSelectionIn(BaseModel):
    product_id: str
    selected_color: str | None = None


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


@router.get("/", response_model=list[ZoneSelectionOut])
async def get_selections(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(TryOnSelection, Product)
        .outerjoin(Product, TryOnSelection.product_id == Product.id)
        .where(TryOnSelection.user_id == current_user.id)
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


@router.put("/{zone}", response_model=ZoneSelectionOut)
async def update_selection(
    zone: str,
    payload: TryOnSelectionIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if zone not in ALL_ZONES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Zona inválida.")

    try:
        product_id = uuid.UUID(payload.product_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="product_id inválido.")

    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")

    result = await db.execute(
        select(TryOnSelection)
        .where(TryOnSelection.user_id == current_user.id)
        .where(TryOnSelection.zone == zone)
    )
    sel = result.scalar_one_or_none()

    if sel:
        sel.product_id = product_id
        sel.selected_color = payload.selected_color
    else:
        sel = TryOnSelection(
            id=uuid.uuid4(),
            user_id=current_user.id,
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


@router.delete("/{zone}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_selection(
    zone: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if zone not in ALL_ZONES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Zona inválida.")

    result = await db.execute(
        select(TryOnSelection)
        .where(TryOnSelection.user_id == current_user.id)
        .where(TryOnSelection.zone == zone)
    )
    sel = result.scalar_one_or_none()
    if sel:
        await db.delete(sel)
        await db.commit()
