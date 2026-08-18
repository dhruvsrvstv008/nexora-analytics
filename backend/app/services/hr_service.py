from sqlalchemy.orm import Session
from app.database import execute_sql


def _p(department_id=None):
    return {"department_id": department_id}


def get_summary(db: Session):
    rows = execute_sql(db, "hr/summary.sql", {})
    return dict(rows[0]) if rows else {}


def get_hiring_trend(db: Session, department_id=None):
    return [dict(r) for r in execute_sql(db, "hr/hiring_trend.sql", _p(department_id))]


def get_attrition(db: Session):
    return [dict(r) for r in execute_sql(db, "hr/attrition.sql", {})]


def get_tenure(db: Session, department_id=None):
    return [dict(r) for r in execute_sql(db, "hr/tenure.sql", _p(department_id))]
