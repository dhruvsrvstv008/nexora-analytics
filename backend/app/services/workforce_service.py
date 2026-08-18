from sqlalchemy.orm import Session
from app.database import execute_sql


def _p(**kwargs):
    defaults = {"year": None, "month": None, "department_id": None, "manager_id": None, "group_by": "department"}
    return {**defaults, **kwargs}


def get_summary(db: Session, department_id=None):
    rows = execute_sql(db, "workforce/summary.sql", _p(department_id=department_id))
    return dict(rows[0]) if rows else {}


def get_distribution(db: Session, group_by="department", department_id=None):
    return [dict(r) for r in execute_sql(
        db, "workforce/distribution.sql", _p(group_by=group_by, department_id=department_id),
    )]


def get_headcount_trend(db: Session, department_id=None):
    return [dict(r) for r in execute_sql(
        db, "workforce/headcount_trend.sql", _p(department_id=department_id),
    )]


def get_hierarchy(db: Session, department_id=None):
    return [dict(r) for r in execute_sql(
        db, "workforce/hierarchy.sql", _p(department_id=department_id),
    )]


def get_manager_overview(db: Session, manager_id: int, year=None):
    rows = execute_sql(db, "workforce/manager_overview.sql", _p(manager_id=manager_id, year=year))
    return dict(rows[0]) if rows else {}


# Salary sub-domain
def get_salary_summary(db: Session, department_id=None):
    rows = execute_sql(db, "workforce/salary_summary.sql", _p(department_id=department_id))
    return dict(rows[0]) if rows else {}


def get_salary_by_department(db: Session):
    return [dict(r) for r in execute_sql(db, "workforce/salary_by_department.sql", _p())]


def get_above_dept_avg(db: Session, department_id=None, use_cte: bool = True):
    sql_file = "workforce/above_dept_avg_cte.sql" if use_cte else "workforce/above_dept_avg_correlated.sql"
    return [dict(r) for r in execute_sql(db, sql_file, _p(department_id=department_id))]


def get_salary_department_rank(db: Session, department_id=None):
    return [dict(r) for r in execute_sql(
        db, "workforce/salary_department_rank.sql", _p(department_id=department_id),
    )]


def get_percentile_bands(db: Session, department_id=None):
    return [dict(r) for r in execute_sql(
        db, "workforce/salary_percentile_bands.sql", _p(department_id=department_id),
    )]


def get_top_earners(db: Session, department_id=None):
    return [dict(r) for r in execute_sql(
        db, "workforce/salary_top_earners.sql", _p(department_id=department_id),
    )]


def get_payroll_share(db: Session):
    return [dict(r) for r in execute_sql(db, "workforce/payroll_share.sql", _p())]
