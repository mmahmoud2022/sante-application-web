"""add is_active to doctor schedules

Revision ID: b9a7a0bdc3a0
Revises: a83c7f3739db
Create Date: 2025-10-21 20:01:12.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b9a7a0bdc3a0"
down_revision = "a83c7f3739db"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add the is_active flag to doctor schedules for soft deletes."""
    op.add_column(
        "doctor_schedules",
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
    )
    op.alter_column("doctor_schedules", "is_active", server_default=None)


def downgrade() -> None:
    """Remove the is_active flag from doctor schedules."""
    op.drop_column("doctor_schedules", "is_active")
