"""add waiting list table

Revision ID: 001_add_waiting_list
Revises: 
Create Date: 2025-10-21 23:53:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_add_waiting_list'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create waiting_lists table
    op.create_table(
        'waiting_lists',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('preferred_date_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('preferred_date_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('preferred_time_slots', sa.String(length=500), nullable=True),
        sa.Column('appointment_reason', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('notified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ),
    )
    op.create_index(op.f('ix_waiting_lists_id'), 'waiting_lists', ['id'], unique=False)
    op.create_index(op.f('ix_waiting_lists_patient_id'), 'waiting_lists', ['patient_id'], unique=False)
    op.create_index(op.f('ix_waiting_lists_doctor_id'), 'waiting_lists', ['doctor_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_waiting_lists_doctor_id'), table_name='waiting_lists')
    op.drop_index(op.f('ix_waiting_lists_patient_id'), table_name='waiting_lists')
    op.drop_index(op.f('ix_waiting_lists_id'), table_name='waiting_lists')
    op.drop_table('waiting_lists')
