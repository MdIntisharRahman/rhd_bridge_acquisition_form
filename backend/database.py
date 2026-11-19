import logging
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.config import settings

logger = logging.getLogger("rhd_adds.db")

engine = None
SessionLocal = None

def run_auto_schema_migrations(eng):
    """
    Auto-detect and add newly introduced columns to existing tables
    across PostgreSQL and SQLite without requiring external Alembic migrations.
    """
    new_columns = [
        ("bridge_acquisitions", "assigned_field_sde_id", "INTEGER"),
        ("bridge_acquisitions", "prepared_design_notes", "TEXT"),
        ("bridge_acquisitions", "prepared_design_attached_at", "TIMESTAMP"),
        ("bridge_acquisitions", "prepared_design_attached_by_id", "INTEGER"),
        ("bridge_acquisitions", "prepared_design_approved_at", "TIMESTAMP"),
        ("bridge_acquisitions", "dispatched_to_field_sde_at", "TIMESTAMP"),
        ("bridge_acquisitions", "dispatched_field_sde_id", "INTEGER"),
        ("bridge_acquisitions", "chainage_km", "FLOAT"),
        ("bridge_acquisitions", "chainage_m", "FLOAT"),
        ("bridge_acquisitions", "design_execution_state", "VARCHAR(50) DEFAULT 'NOT_STARTED'"),
        ("bridge_acquisitions", "bottleneck_reason", "VARCHAR(255)"),
        ("bridge_acquisitions", "bottleneck_notes", "TEXT"),
        ("bridge_acquisitions", "bottleneck_updated_at", "TIMESTAMP"),
        ("bridge_acquisitions", "design_completed_at", "TIMESTAMP"),
        ("bridge_acquisitions", "design_target_date", "TIMESTAMP"),
        
        ("culvert_acquisitions", "assigned_field_sde_id", "INTEGER"),
        ("culvert_acquisitions", "prepared_design_notes", "TEXT"),
        ("culvert_acquisitions", "prepared_design_attached_at", "TIMESTAMP"),
        ("culvert_acquisitions", "prepared_design_attached_by_id", "INTEGER"),
        ("culvert_acquisitions", "prepared_design_approved_at", "TIMESTAMP"),
        ("culvert_acquisitions", "dispatched_to_field_sde_at", "TIMESTAMP"),
        ("culvert_acquisitions", "dispatched_field_sde_id", "INTEGER"),
        ("culvert_acquisitions", "chainage_km", "FLOAT"),
        ("culvert_acquisitions", "chainage_m", "FLOAT"),
        ("culvert_acquisitions", "design_execution_state", "VARCHAR(50) DEFAULT 'NOT_STARTED'"),
        ("culvert_acquisitions", "bottleneck_reason", "VARCHAR(255)"),
        ("culvert_acquisitions", "bottleneck_notes", "TEXT"),
        ("culvert_acquisitions", "bottleneck_updated_at", "TIMESTAMP"),
        ("culvert_acquisitions", "design_completed_at", "TIMESTAMP"),
        ("culvert_acquisitions", "design_target_date", "TIMESTAMP"),

        ("rhd_divisions", "ee_name", "VARCHAR(255)"),
        ("rhd_divisions", "contact_email", "VARCHAR(255)"),
        ("rhd_divisions", "contact_phone", "VARCHAR(50)"),

        ("attachments", "file_path", "VARCHAR(500)"),
        ("attachments", "stored_file_name", "VARCHAR(255)"),
        ("attachments", "demand_officer_type", "VARCHAR(50)"),
    ]
    try:
        inspector = inspect(eng)
        existing_tables = inspector.get_table_names()
        with eng.connect() as conn:
            for table_name, col_name, col_type in new_columns:
                if table_name in existing_tables:
                    existing_cols = [c["name"] for c in inspector.get_columns(table_name)]
                    if col_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}"))
                        conn.commit()
                        logger.info("Auto-migrated table '%s': added missing column '%s'", table_name, col_name)
    except Exception as err:
        logger.debug("Auto-migration notice: %s", err)

def _ensure_pg_database_exists(db_url_str: str):
    """If target PostgreSQL database doesn't exist, create it via maintenance db."""
    try:
        url = make_url(db_url_str)
        if not url.drivername.startswith("postgresql"):
            return
        target_db = url.database
        if not target_db:
            return

        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

        host = url.host or "127.0.0.1"
        port = url.port or 5432
        user = url.username or "postgres"
        password = url.password or "postgres"

        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            dbname="postgres",
            connect_timeout=3
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (target_db,))
        exists = cur.fetchone()
        if not exists:
            cur.execute(f'CREATE DATABASE "{target_db}"')
            logger.info("Automatically created PostgreSQL database '%s'", target_db)
        cur.close()
        conn.close()

        # Enable PostGIS extension if available
        try:
            conn_target = psycopg2.connect(
                host=host, port=port, user=user, password=password, dbname=target_db, connect_timeout=3
            )
            conn_target.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cur_target = conn_target.cursor()
            cur_target.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
            cur_target.close()
            conn_target.close()
        except Exception:
            pass
    except Exception as e:
        logger.debug("Database verification note for '%s': %s", db_url_str, e)

try:
    _ensure_pg_database_exists(settings.DATABASE_URL)
    # Attempt primary PostgreSQL connection
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )
    # Test connection
    with engine.connect() as conn:
        logger.info("Connected successfully to primary PostgreSQL database at %s", settings.DATABASE_URL)
except Exception as e:
    logger.warning("Could not connect to PostgreSQL (%s). Falling back to SQLite database at %s", e, settings.SQLITE_FALLBACK_URL)
    engine = create_engine(
        settings.SQLITE_FALLBACK_URL,
        connect_args={"check_same_thread": False}
    )

# Execute safe auto-migrations for new columns
run_auto_schema_migrations(engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
