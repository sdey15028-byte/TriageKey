"""public receipts only
Revision ID: 20260923_01
Revises: 
"""
from alembic import op
import sqlalchemy as sa
revision = "20260923_01"
down_revision = None
branch_labels = None
depends_on = None
def upgrade():
    op.create_table("public_receipts", sa.Column("transaction_id", sa.String(128), primary_key=True), sa.Column("contract_address", sa.String(128), nullable=False), sa.Column("disclosure_scope", sa.String(20), nullable=False), sa.Column("nullifier", sa.String(128), nullable=False, unique=True), sa.Column("network", sa.String(20), nullable=False), sa.Column("finalized_at", sa.DateTime(timezone=True), nullable=False))
def downgrade(): op.drop_table("public_receipts")
