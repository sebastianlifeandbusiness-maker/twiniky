import asyncio
import sys
import os
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select, delete
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.core.security import hash_password

PRODUCTS_DATA = [
    {
        "name": "Camiseta Esencial Blanca",
        "brand": "Studio Basic",
        "category": "Tops",
        "price": Decimal("15990"),
        "description": "Camiseta de algodón orgánico con corte relajado. Un básico atemporal para cualquier look.",
        "sizes": ["XS", "S", "M", "L", "XL"],
        "image_urls": [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
            "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=600&q=80",
        ],
        "stock": 50,
    },
    {
        "name": "Top Asimétrico Cacao",
        "brand": "Velour",
        "category": "Tops",
        "price": Decimal("24990"),
        "description": "Top de punto con hombro asimétrico y manga larga en tono cacao. Textura premium.",
        "sizes": ["XS", "S", "M", "L"],
        "image_urls": [
            "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80",
            "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80",
        ],
        "stock": 30,
    },
    {
        "name": "Jeans Slim Índigo",
        "brand": "Denim Co.",
        "category": "Pantalones",
        "price": Decimal("49990"),
        "description": "Vaqueros slim fit de tiro medio con lavado índigo profundo y elástico de confort.",
        "sizes": ["28", "30", "32", "34", "36"],
        "image_urls": [
            "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
            "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80",
        ],
        "stock": 40,
    },
    {
        "name": "Pantalón Cargo Verde Oliva",
        "brand": "Urban Label",
        "category": "Pantalones",
        "price": Decimal("39990"),
        "description": "Pantalón cargo con bolsillos laterales y cintura elástica ajustable.",
        "sizes": ["S", "M", "L", "XL"],
        "image_urls": [
            "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&q=80",
            "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80",
        ],
        "stock": 25,
    },
    {
        "name": "Vestido Midi Floral",
        "brand": "Bloom Studio",
        "category": "Vestidos",
        "price": Decimal("59990"),
        "description": "Vestido midi de escote en V con estampado floral primaveral y manga larga abullonada.",
        "sizes": ["XS", "S", "M", "L"],
        "image_urls": [
            "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80",
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80",
        ],
        "stock": 20,
    },
    {
        "name": "Vestido Slip Satinado Negro",
        "brand": "Noir",
        "category": "Vestidos",
        "price": Decimal("79990"),
        "description": "Vestido slip de satén con tirantes finos y escote recto. Elegancia mínima.",
        "sizes": ["XS", "S", "M", "L", "XL"],
        "image_urls": [
            "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80",
            "https://images.unsplash.com/photo-1496217590455-aa63a8350eea?w=600&q=80",
        ],
        "stock": 15,
    },
    {
        "name": "Blazer Oversize Crudo",
        "brand": "Tailored",
        "category": "Chaquetas",
        "price": Decimal("79990"),
        "description": "Blazer de corte oversized en tono crudo con botonadura doble y bolsillos de parche.",
        "sizes": ["XS", "S", "M", "L"],
        "image_urls": [
            "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
            "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=600&q=80",
        ],
        "stock": 18,
    },
    {
        "name": "Chaqueta Cuero Sintético Negro",
        "brand": "Edge",
        "category": "Chaquetas",
        "price": Decimal("99990"),
        "description": "Chaqueta de cuero sintético con cremalleras metálicas y cuello mao. Actitud urbana.",
        "sizes": ["S", "M", "L", "XL"],
        "image_urls": [
            "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80",
            "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=600&q=80",
        ],
        "stock": 12,
    },
    {
        "name": "Sneakers Blancas Platform",
        "brand": "Step Co.",
        "category": "Zapatos",
        "price": Decimal("59990"),
        "description": "Zapatillas de cuero blanco con suela chunky vulcanizada. Icónicas y versátiles.",
        "sizes": ["36", "37", "38", "39", "40", "41", "42"],
        "image_urls": [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80",
        ],
        "stock": 35,
    },
    {
        "name": "Botas Chelsea Camel",
        "brand": "Heritage",
        "category": "Zapatos",
        "price": Decimal("79990"),
        "description": "Botas Chelsea de cuero genuino en tono camel con elásticos laterales y tacón bloque.",
        "sizes": ["36", "37", "38", "39", "40", "41"],
        "image_urls": [
            "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80",
            "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80",
        ],
        "stock": 22,
    },
    {
        "name": "Bolso Tote Canvas Natural",
        "brand": "Carry All",
        "category": "Accesorios",
        "price": Decimal("19990"),
        "description": "Bolso tote de canvas grueso con asas de algodón trenzado y bolsillo interior con cremallera.",
        "sizes": ["Única"],
        "image_urls": [
            "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
            "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80",
        ],
        "stock": 60,
    },
    {
        "name": "Gafas de Sol Redondas Doradas",
        "brand": "Shade",
        "category": "Accesorios",
        "price": Decimal("24990"),
        "description": "Gafas de sol con montura metálica dorada y lentes degradadas gris. Estilo vintage moderno.",
        "sizes": ["Única"],
        "image_urls": [
            "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80",
            "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80",
        ],
        "stock": 45,
    },
]


async def seed():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "store@twiniky.com"))
        seller = result.scalar_one_or_none()

        if not seller:
            seller = User(
                email="store@twiniky.com",
                hashed_password=hash_password("twiniky2024"),
                full_name="Twiniky Official Store",
                is_active=True,
                is_seller=True,
            )
            db.add(seller)
            await db.flush()
            print(f"Created seller: {seller.email}")
        else:
            print(f"Using existing seller: {seller.email}")

        await db.execute(delete(Order))
        await db.execute(delete(Product))

        for data in PRODUCTS_DATA:
            product = Product(seller_id=seller.id, **data)
            db.add(product)

        await db.commit()
        print(f"Seeded {len(PRODUCTS_DATA)} products successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
