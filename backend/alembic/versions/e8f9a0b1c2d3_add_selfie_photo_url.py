"""add_selfie_photo_url

Revision ID: e8f9a0b1c2d3
Revises: d6e7f8a9b0c1
Create Date: 2026-08-21 10:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e8f9a0b1c2d3"
down_revision: Union[str, None] = "d6e7f8a9b0c1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("avatar_measurements", sa.Column("selfie_photo_url", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("avatar_measurements", "selfie_photo_url")
