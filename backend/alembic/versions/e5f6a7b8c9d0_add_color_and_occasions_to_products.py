"""add_color_and_occasions_to_products

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-20 16:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("products", sa.Column("color", sa.String(50), nullable=True))
    op.add_column("products", sa.Column("occasions", postgresql.ARRAY(sa.String()), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "occasions")
    op.drop_column("products", "color")
