"""add document_id to prescriptions

Revision ID: c620fbb4c0df
Revises: b9a7a0bdc3a0
Create Date: 2025-10-22 09:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c620fbb4c0df"
down_revision = "b9a7a0bdc3a0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add the optional document_id foreign key to prescriptions."""
    op.add_column(
        "prescriptions",
        sa.Column("document_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_prescriptions_document_id_documents",
        "prescriptions",
        "documents",
        ["document_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_prescriptions_document_id",
        "prescriptions",
        ["document_id"],
    )


def downgrade() -> None:
    """Remove the document_id foreign key from prescriptions."""
    op.drop_index("ix_prescriptions_document_id", table_name="prescriptions")
    op.drop_constraint(
        "fk_prescriptions_document_id_documents",
        "prescriptions",
        type_="foreignkey",
    )
    op.drop_column("prescriptions", "document_id")
