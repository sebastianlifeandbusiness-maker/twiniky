"""add_avatar_skin_tone

Revision ID: c5d6e7f8a9b0
Revises: e7f8a9b0c1d2
Create Date: 2026-06-29 10:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c5d6e7f8a9b0"
down_revision: Union[str, None] = "e7f8a9b0c1d2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("avatar_measurements", sa.Column("skin_tone", sa.String(10), nullable=True))


def downgrade() -> None:
    op.drop_column("avatar_measurements", "skin_tone")
