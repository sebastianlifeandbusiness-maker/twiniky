"""add_hashed_password_to_brands

Revision ID: b2c3d4e5f6a7
Revises: fdf94200d803
Create Date: 2026-05-22 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'fdf94200d803'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # La tabla brands fue creada manualmente por migrate_brands.py sin hashed_password.
    # 1) Agregar la columna como nullable para no romper filas existentes.
    op.add_column('brands', sa.Column('hashed_password', sa.String(length=255), nullable=True))
    # 2) Rellenar filas existentes con cadena vacía (quedan bloqueadas; deben re-registrarse).
    op.execute("UPDATE brands SET hashed_password = '' WHERE hashed_password IS NULL")
    # 3) Hacer NOT NULL ahora que todas las filas tienen valor.
    op.alter_column('brands', 'hashed_password', nullable=False)


def downgrade() -> None:
    op.drop_column('brands', 'hashed_password')
