from sqlalchemy.orm import Session
from app.database import execute_sql


def _p(**kwargs):
    return {"category_id": None, "alert_type": None, **kwargs}


def get_summary(db: Session, category_id=None):
    rows = execute_sql(db, "inventory/summary.sql", _p(category_id=category_id))
    return dict(rows[0]) if rows else {}


def get_by_category(db: Session):
    return [dict(r) for r in execute_sql(db, "inventory/by_category.sql", _p())]


def get_alerts(db: Session, alert_type=None, category_id=None):
    return [dict(r) for r in execute_sql(
        db, "inventory/alerts.sql", _p(alert_type=alert_type, category_id=category_id),
    )]


def get_velocity(db: Session, category_id=None):
    return [dict(r) for r in execute_sql(db, "inventory/velocity.sql", _p(category_id=category_id))]
