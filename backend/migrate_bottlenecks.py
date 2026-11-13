import sys
import os

root_path = r"E:\acqform"
if root_path not in sys.path:
    sys.path.insert(0, root_path)

from sqlalchemy import text, create_engine
from backend.database import engine
from backend.config import settings

def migrate_database(db_engine, name="PostgreSQL"):
    print(f"Applying schema additions to {name}...")
    with db_engine.begin() as conn:
        # Check / add columns to rhd_divisions
        div_cols = [
            ("ee_name", "VARCHAR(255)"),
            ("contact_email", "VARCHAR(255)"),
            ("contact_phone", "VARCHAR(50)")
        ]
        for col, col_type in div_cols:
            try:
                conn.execute(text(f"ALTER TABLE rhd_divisions ADD COLUMN {col} {col_type}"))
                print(f"  Added rhd_divisions.{col}")
            except Exception as e:
                # Column likely exists
                pass

        # Check / add columns to bridge_acquisitions
        tracking_cols = [
            ("design_execution_state", "VARCHAR(50) DEFAULT 'NOT_STARTED'"),
            ("bottleneck_reason", "VARCHAR(255)"),
            ("bottleneck_notes", "TEXT"),
            ("bottleneck_updated_at", "TIMESTAMP"),
            ("design_completed_at", "TIMESTAMP"),
            ("design_target_date", "TIMESTAMP")
        ]
        for col, col_type in tracking_cols:
            try:
                conn.execute(text(f"ALTER TABLE bridge_acquisitions ADD COLUMN {col} {col_type}"))
                print(f"  Added bridge_acquisitions.{col}")
            except Exception as e:
                pass

        # Check / add columns to culvert_acquisitions
        for col, col_type in tracking_cols:
            try:
                conn.execute(text(f"ALTER TABLE culvert_acquisitions ADD COLUMN {col} {col_type}"))
                print(f"  Added culvert_acquisitions.{col}")
            except Exception as e:
                pass
    print(f"Migration completed for {name}.")

if __name__ == "__main__":
    migrate_database(engine, "Primary Database")
    sqlite_engine = create_engine(settings.SQLITE_FALLBACK_URL, connect_args={"check_same_thread": False})
    migrate_database(sqlite_engine, "SQLite Fallback Database")
