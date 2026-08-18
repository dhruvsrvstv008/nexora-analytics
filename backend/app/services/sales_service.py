from sqlalchemy.orm import Session
from app.database import execute_sql


def _p(year=None, month=None, department_id=None, region_id=None,
       manager_id=None, category_id=None, status=None, limit=50, offset=0):
    return {
        "year": year, "month": month, "department_id": department_id,
        "region_id": region_id, "manager_id": manager_id,
        "category_id": category_id, "status": status,
        "limit": limit, "offset": offset,
    }


def get_summary(db: Session, year=None, month=None, department_id=None, region_id=None):
    rows = execute_sql(db, "sales/summary.sql", _p(year=year, month=month,
                       department_id=department_id, region_id=region_id))
    return dict(rows[0]) if rows else {}


def get_monthly_trend(db: Session, year=None, department_id=None, region_id=None):
    return [dict(r) for r in execute_sql(
        db, "sales/monthly_trend.sql",
        _p(year=year, department_id=department_id, region_id=region_id),
    )]


def get_by_department(db: Session, year=None, month=None, region_id=None):
    return [dict(r) for r in execute_sql(
        db, "sales/by_department.sql", _p(year=year, month=month, region_id=region_id),
    )]


def get_by_employee(db: Session, year=None, month=None, department_id=None,
                    manager_id=None, region_id=None):
    return [dict(r) for r in execute_sql(
        db, "sales/by_employee.sql",
        _p(year=year, month=month, department_id=department_id,
           manager_id=manager_id, region_id=region_id),
    )]


def get_by_manager(db: Session, year=None, month=None, department_id=None):
    return [dict(r) for r in execute_sql(
        db, "sales/by_manager.sql", _p(year=year, month=month, department_id=department_id),
    )]


def get_by_product(db: Session, year=None, month=None, category_id=None, department_id=None):
    return [dict(r) for r in execute_sql(
        db, "sales/by_product.sql",
        _p(year=year, month=month, category_id=category_id, department_id=department_id),
    )]


def get_by_category(db: Session, year=None, month=None, department_id=None):
    return [dict(r) for r in execute_sql(
        db, "sales/by_category.sql",
        _p(year=year, month=month, department_id=department_id),
    )]


def get_by_region(db: Session, year=None, month=None, department_id=None):
    return [dict(r) for r in execute_sql(
        db, "sales/by_region.sql",
        _p(year=year, month=month, department_id=department_id),
    )]


def get_targets(db: Session, year=None, month=None, department_id=None, manager_id=None):
    return [dict(r) for r in execute_sql(
        db, "sales/target_vs_actual.sql",
        _p(year=year, month=month, department_id=department_id, manager_id=manager_id),
    )]


def get_top_products(db: Session, year=None):
    return [dict(r) for r in execute_sql(db, "sales/top_products.sql", _p(year=year))]


def get_top_per_category(db: Session, year=None):
    return [dict(r) for r in execute_sql(db, "sales/top_per_category.sql", _p(year=year))]


def get_orders(db: Session, year=None, month=None, department_id=None, region_id=None,
               status=None, limit=50, offset=0):
    return [dict(r) for r in execute_sql(
        db, "sales/orders_paginated.sql",
        _p(year=year, month=month, department_id=department_id, region_id=region_id,
           status=status, limit=limit, offset=offset),
    )]
