"""Store finalized chain identifiers distinctly.

Revision ID: 20260927_02
Revises: 20260923_01
"""
from alembic import op
import sqlalchemy as sa

revision = "20260927_02"
down_revision = "20260923_01"
branch_labels = None
depends_on = None


def upgrade():
    existing_rows = op.get_bind().execute(sa.text("SELECT COUNT(*) FROM public_receipts")).scalar_one()
    if existing_rows:
        raise RuntimeError(
            "Existing receipts require their real finalized transaction hashes before this migration can continue."
        )

    with op.batch_alter_table("public_receipts") as batch:
        batch.add_column(sa.Column("transaction_hash", sa.String(128), nullable=True))
        batch.add_column(sa.Column("receipt_type", sa.String(20), nullable=False, server_default="proof"))
        batch.add_column(sa.Column("block_height", sa.Integer(), nullable=True))
        batch.alter_column("disclosure_scope", existing_type=sa.String(20), nullable=True)
        batch.alter_column("nullifier", existing_type=sa.String(128), nullable=True)
        batch.create_unique_constraint("uq_public_receipts_transaction_hash", ["transaction_hash"])

    with op.batch_alter_table("public_receipts") as batch:
        batch.alter_column("transaction_hash", existing_type=sa.String(128), nullable=False)
        batch.alter_column("receipt_type", existing_type=sa.String(20), server_default=None)


def downgrade():
    with op.batch_alter_table("public_receipts") as batch:
        batch.drop_constraint("uq_public_receipts_transaction_hash", type_="unique")
        batch.alter_column("nullifier", existing_type=sa.String(128), nullable=False)
        batch.alter_column("disclosure_scope", existing_type=sa.String(20), nullable=False)
        batch.drop_column("block_height")
        batch.drop_column("receipt_type")
        batch.drop_column("transaction_hash")
