import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.db.session import AsyncSessionLocal


async def migrate():
    async with AsyncSessionLocal() as db:
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS brands (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                logo_url VARCHAR(500),
                description TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        """))

        await db.execute(text("""
            ALTER TABLE products ALTER COLUMN seller_id DROP NOT NULL
        """))

        await db.execute(text("""
            ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id)
        """))

        await db.commit()
        print("Migration complete.")


asyncio.run(migrate())
