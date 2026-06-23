"""add_avatar_measurements

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-06-22 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "avatar_measurements",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("height", sa.Float(), nullable=False),
        sa.Column("bust", sa.Float(), nullable=False),
        sa.Column("waist", sa.Float(), nullable=False),
        sa.Column("hips", sa.Float(), nullable=False),
        sa.Column("shoulder_width", sa.Float(), nullable=False),
        sa.Column("torso_length", sa.Float(), nullable=False),
        sa.Column("leg_length", sa.Float(), nullable=False),
        sa.Column("arm_length", sa.Float(), nullable=False),
        sa.Column("arm_girth", sa.Float(), nullable=False),
        sa.Column("thigh_girth", sa.Float(), nullable=False),
        sa.Column("calf_girth", sa.Float(), nullable=False),
        sa.Column("shoe_size", sa.Float(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("avatar_measurements")
