"""add_avatar_profile_fields

Revision ID: e7f8a9b0c1d2
Revises: d5e6f7a8b9c0
Create Date: 2026-06-28 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e7f8a9b0c1d2"
down_revision: Union[str, None] = "f8a9b0c1d2e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("avatar_measurements", sa.Column("sex", sa.String(10), nullable=True))
    op.add_column("avatar_measurements", sa.Column("age_group", sa.String(20), nullable=True))
    op.add_column("avatar_measurements", sa.Column("body_type", sa.String(20), nullable=True))
    op.add_column("avatar_measurements", sa.Column("weight", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("avatar_measurements", "weight")
    op.drop_column("avatar_measurements", "body_type")
    op.drop_column("avatar_measurements", "age_group")
    op.drop_column("avatar_measurements", "sex")
