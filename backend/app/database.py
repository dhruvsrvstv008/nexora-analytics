from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

SQL_DIR = Path(__file__).parent / "sql"


class Base(DeclarativeBase):
    pass


def load_sql(relative_path: str) -> str:
    """Load a .sql file from app/sql/ by relative path, e.g. 'sales/summary.sql'."""
    return (SQL_DIR / relative_path).read_text()


def execute_sql(db, relative_path: str, params: dict | None = None):
    """Execute a named .sql file and return all rows as mappings."""
    query = text(load_sql(relative_path))
    result = db.execute(query, params or {})
    return result.mappings().all()
