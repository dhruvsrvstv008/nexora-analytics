from sqlalchemy.orm import Session
from app.database import execute_sql


def _p(year=None):
    return {"year": year}


def get_summary(db: Session, year=None):
    rows = execute_sql(db, "finance/summary.sql", _p(year))
    return dict(rows[0]) if rows else {}


def get_monthly_trend(db: Session, year=None):
    return [dict(r) for r in execute_sql(db, "finance/monthly_trend.sql", _p(year))]


def get_department_costs(db: Session, year=None):
    return [dict(r) for r in execute_sql(db, "finance/department_costs.sql", _p(year))]


def get_dept_pnl(db: Session, year=None):
    return [dict(r) for r in execute_sql(db, "finance/dept_pnl.sql", _p(year))]
