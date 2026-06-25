import asyncio
import os
import sys
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.brand import Brand
from app.models.product import Product
from app.models.user import User  # noqa: F401 — necesario para resolver relaciones de Product
from app.core.security import hash_password

BRANDS_DATA = [
    {
        "name": "Nike",
        "email": "nike@twiniky.cl",
        "password": "Nike2026!",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
        "description": "Just Do It. Equipamiento deportivo y lifestyle para el mundo.",
        "product": {
            "name": "Air Force 1 '07 Blancas",
            "category": "Zapatos",
            "price": Decimal("89990"),
            "sizes": ["38", "39", "40", "41", "42", "43"],
            "color": "blanco",
            "description": "El icónico Air Force 1 en cuero blanco premium. Comodidad y estilo clásico.",
            "image_urls": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"],
            "stock": 40,
        },
    },
    {
        "name": "Adidas",
        "email": "adidas@twiniky.cl",
        "password": "Adidas2026!",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg",
        "description": "Impossible is Nothing. Moda deportiva y lifestyle de clase mundial.",
        "product": {
            "name": "Tiro 21 Track Pants",
            "category": "Pantalones",
            "price": Decimal("49990"),
            "sizes": ["S", "M", "L", "XL"],
            "color": "negro",
            "description": "Pantalón de entrenamiento Tiro 21 con tecnología AEROREADY. Corte ajustado.",
            "image_urls": ["https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80"],
            "stock": 35,
        },
    },
    {
        "name": "Zara",
        "email": "zara@twiniky.cl",
        "password": "Zara2026!",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg",
        "description": "Moda de vanguardia con las últimas tendencias de temporada.",
        "product": {
            "name": "Blazer Oversize Camel",
            "category": "Chaquetas",
            "price": Decimal("59990"),
            "sizes": ["XS", "S", "M", "L", "XL"],
            "color": "camel",
            "description": "Blazer oversize en tono camel con botonadura sencilla. Corte estructurado.",
            "image_urls": ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80"],
            "stock": 20,
        },
    },
    {
        "name": "Americanino",
        "email": "americanino@twiniky.cl",
        "password": "Americanino2026!",
        "logo_url": None,
        "description": "Denim y moda joven chilena con identidad latinoamericana.",
        "product": {
            "name": "Jeans Skinny Azul Oscuro",
            "category": "Pantalones",
            "price": Decimal("39990"),
            "sizes": ["28", "30", "32", "34", "36"],
            "color": "azul marino",
            "description": "Jeans skinny fit de tiro alto en denim azul oscuro con acabado liso.",
            "image_urls": ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80"],
            "stock": 45,
        },
    },
    {
        "name": "H&M",
        "email": "hm@twiniky.cl",
        "password": "HM2026!",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg",
        "description": "Moda sostenible y accesible para todos los estilos y ocasiones.",
        "product": {
            "name": "Vestido Midi Floral Verano",
            "category": "Vestidos",
            "price": Decimal("29990"),
            "sizes": ["XS", "S", "M", "L"],
            "color": "rosa",
            "description": "Vestido midi con estampado floral y escote en V. Perfecto para el verano.",
            "image_urls": ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80"],
            "stock": 30,
        },
    },
    {
        "name": "Diesel",
        "email": "diesel@twiniky.cl",
        "password": "Diesel2026!",
        "logo_url": None,
        "description": "Denim premium y actitud rebelde desde 1978.",
        "product": {
            "name": "Camiseta Logo Basica Negra",
            "category": "Tops",
            "price": Decimal("34990"),
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "color": "negro",
            "description": "Camiseta de algodon con logo bordado en el pecho. Corte regular.",
            "image_urls": ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80"],
            "stock": 50,
        },
    },
    {
        "name": "Hugo Boss",
        "email": "hugoboss@twiniky.cl",
        "password": "HugoBoss2026!",
        "logo_url": None,
        "description": "Elegancia alemana y sofisticacion contemporanea para el hombre y la mujer modernos.",
        "product": {
            "name": "Polo Classic Fit Navy",
            "category": "Tops",
            "price": Decimal("69990"),
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "color": "azul marino",
            "description": "Polo de algodon pique con logo bordado. Corte classic fit en azul navy.",
            "image_urls": ["https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&q=80"],
            "stock": 25,
        },
    },
    {
        "name": "Lacoste",
        "email": "lacoste@twiniky.cl",
        "password": "Lacoste2026!",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/a/a4/Lacoste_logo.svg",
        "description": "El cocodrilo mas famoso del mundo. Polo y lifestyle de lujo accesible.",
        "product": {
            "name": "Polo Petit Pique Verde",
            "category": "Tops",
            "price": Decimal("79990"),
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "color": "verde",
            "description": "El clasico polo Lacoste en pique verde con cocodrilo bordado.",
            "image_urls": ["https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&q=80"],
            "stock": 30,
        },
    },
    {
        "name": "Tommy Hilfiger",
        "email": "tommy@twiniky.cl",
        "password": "Tommy2026!",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/8/80/Tommy_Hilfiger_logo.svg",
        "description": "Estilo americano clasico con un toque preppy y moderno.",
        "product": {
            "name": "Camiseta Rayas Clasica",
            "category": "Tops",
            "price": Decimal("44990"),
            "sizes": ["XS", "S", "M", "L", "XL"],
            "color": "blanco",
            "description": "Camiseta de algodon con rayas en rojo, blanco y azul. Icono del estilo preppy.",
            "image_urls": ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80"],
            "stock": 40,
        },
    },
    {
        "name": "Calvin Klein",
        "email": "calvinklein@twiniky.cl",
        "password": "CalvinKlein2026!",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/9/9e/Calvin_Klein_logo.svg",
        "description": "Minimalismo moderno y sensualidad en cada prenda.",
        "product": {
            "name": "Jeans Slim Fit Gris",
            "category": "Pantalones",
            "price": Decimal("69990"),
            "sizes": ["28", "30", "32", "34", "36"],
            "color": "gris",
            "description": "Jeans slim fit en denim gris con lavado desgastado sutil.",
            "image_urls": ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80"],
            "stock": 35,
        },
    },
    {
        "name": "Levis",
        "email": "levis@twiniky.cl",
        "password": "Levis2026!",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/7/71/Levi%27s_logo_red.svg",
        "description": "Desde 1873, el denim mas icónico del mundo.",
        "product": {
            "name": "501 Original Jeans",
            "category": "Pantalones",
            "price": Decimal("59990"),
            "sizes": ["28", "30", "32", "34", "36"],
            "color": "azul",
            "description": "El jean original 501 en corte recto y tiro medio. Un clasico atemporal.",
            "image_urls": ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80"],
            "stock": 50,
        },
    },
    {
        "name": "New Balance",
        "email": "newbalance@twiniky.cl",
        "password": "NewBalance2026!",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/e/ea/New_Balance_logo.svg",
        "description": "Rendimiento y estilo. Zapatillas hechas para durar.",
        "product": {
            "name": "990v5 Made in USA",
            "category": "Zapatos",
            "price": Decimal("119990"),
            "sizes": ["38", "39", "40", "41", "42", "43"],
            "color": "gris",
            "description": "Fabricada en Estados Unidos con materiales premium. Confort excepcional.",
            "image_urls": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"],
            "stock": 20,
        },
    },
    {
        "name": "Puma",
        "email": "puma@twiniky.cl",
        "password": "Puma2026!",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Puma_logo.svg",
        "description": "Velocidad, estilo y cultura urbana desde 1948.",
        "product": {
            "name": "Suede Classic Negras",
            "category": "Zapatos",
            "price": Decimal("69990"),
            "sizes": ["38", "39", "40", "41", "42", "43"],
            "color": "negro",
            "description": "El Suede Classic en ante negro. Un icono del streetwear desde los años 60.",
            "image_urls": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"],
            "stock": 30,
        },
    },
    {
        "name": "Caterpillar",
        "email": "caterpillar@twiniky.cl",
        "password": "Caterpillar2026!",
        "logo_url": None,
        "description": "Calzado y ropa de trabajo resistente para los que construyen el mundo.",
        "product": {
            "name": "Bototo Leather Work Boot",
            "category": "Zapatos",
            "price": Decimal("89990"),
            "sizes": ["39", "40", "41", "42", "43", "44"],
            "color": "camel",
            "description": "Bota de trabajo en cuero genuino con punta reforzada y suela antideslizante.",
            "image_urls": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"],
            "stock": 25,
        },
    },
    {
        "name": "Ferouch",
        "email": "ferouch@twiniky.cl",
        "password": "Ferouch2026!",
        "logo_url": None,
        "description": "Marca chilena de outdoor y montaña. Hecha para el sur del mundo.",
        "product": {
            "name": "Chaqueta Outdoor Impermeable",
            "category": "Chaquetas",
            "price": Decimal("79990"),
            "sizes": ["S", "M", "L", "XL"],
            "color": "negro",
            "description": "Chaqueta impermeable con tecnologia DryTech. Perfecta para trekking y ciudad.",
            "image_urls": ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80"],
            "stock": 20,
        },
    },
    {
        "name": "MAUI",
        "email": "maui@twiniky.cl",
        "password": "Maui2026!",
        "logo_url": None,
        "description": "Marca chilena de surf y playa. El espiritu del oceano Pacifico.",
        "product": {
            "name": "Polera Surf Dry Fit",
            "category": "Tops",
            "price": Decimal("24990"),
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "color": "azul",
            "description": "Polera de alto rendimiento con tecnologia Dry Fit. Ideal para deportes acuaticos.",
            "image_urls": ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80"],
            "stock": 60,
        },
    },
    {
        "name": "Sparta",
        "email": "sparta@twiniky.cl",
        "password": "Sparta2026!",
        "logo_url": None,
        "description": "Ropa deportiva chilena para el alto rendimiento.",
        "product": {
            "name": "Short Running Deportivo",
            "category": "Pantalones",
            "price": Decimal("19990"),
            "sizes": ["S", "M", "L", "XL"],
            "color": "negro",
            "description": "Short de running con bolsillo trasero con cremallera y tela ligera transpirable.",
            "image_urls": ["https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80"],
            "stock": 45,
        },
    },
]


async def seed():
    async with AsyncSessionLocal() as db:
        created = 0
        updated = 0

        for data in BRANDS_DATA:
            result = await db.execute(select(Brand).where(Brand.email == data["email"]))
            brand = result.scalar_one_or_none()

            if brand:
                brand.name = data["name"]
                brand.hashed_password = hash_password(data["password"])
                brand.logo_url = data["logo_url"]
                brand.description = data["description"]
                updated += 1
                print(f"  Updated brand: {data['name']}")
            else:
                brand = Brand(
                    name=data["name"],
                    email=data["email"],
                    hashed_password=hash_password(data["password"]),
                    logo_url=data["logo_url"],
                    description=data["description"],
                )
                db.add(brand)
                await db.flush()
                created += 1
                print(f"  Created brand: {data['name']}")

            product_data = data["product"]
            result = await db.execute(
                select(Product).where(
                    Product.brand_id == brand.id,
                    Product.name == product_data["name"],
                )
            )
            existing_product = result.scalar_one_or_none()

            if not existing_product:
                product = Product(
                    brand_id=brand.id,
                    brand=data["name"],
                    name=product_data["name"],
                    category=product_data["category"],
                    price=product_data["price"],
                    sizes=product_data["sizes"],
                    color=product_data["color"],
                    description=product_data["description"],
                    image_urls=product_data["image_urls"],
                    stock=product_data["stock"],
                )
                db.add(product)
                print(f"    > Product created: {product_data['name']}")
            else:
                print(f"    > Product already exists: {product_data['name']}")

        await db.commit()
        print(f"\nDone: {created} brands created, {updated} updated.")


if __name__ == "__main__":
    asyncio.run(seed())
