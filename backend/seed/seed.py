"""
Idempotent seed script for Nexora Analytics.
Usage (from backend/):
    python -m seed.seed
"""

import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import text
from app.database import engine
from app.models import (
    Department, Region, Category, Product, Employee, User,
    Inventory, StockMovement, Sale, SaleItem, Target, Expense,
)
from app.database import Base
from seed.generate_data import generate_all


def _bulk(conn, table, rows: list[dict], chunk: int = 2000) -> None:
    if not rows:
        return
    for i in range(0, len(rows), chunk):
        conn.execute(table.__table__.insert(), rows[i : i + chunk])


def _reset_seq(conn, table_name: str, col: str = "id") -> None:
    conn.execute(text(
        f"SELECT setval(pg_get_serial_sequence('{table_name}', '{col}'), "
        f"COALESCE(MAX({col}), 1)) FROM {table_name}"
    ))


def seed() -> None:
    data = generate_all()

    print("\nConnecting to database and truncating existing data...")
    with engine.begin() as conn:
        # Truncate in reverse FK order
        conn.execute(text("SET session_replication_role = replica"))  # disable FK checks
        for tbl in [
            "expenses", "targets", "stock_movements", "inventory",
            "sale_items", "sales", "users", "employees",
            "products", "categories", "regions", "departments",
        ]:
            conn.execute(text(f"TRUNCATE TABLE {tbl} RESTART IDENTITY CASCADE"))
        conn.execute(text("SET session_replication_role = DEFAULT"))

        print("Inserting departments...")
        _bulk(conn, Department, data["departments"])

        print("Inserting regions...")
        _bulk(conn, Region, data["regions"])

        print("Inserting categories...")
        _bulk(conn, Category, data["categories"])

        print(f"Inserting {len(data['products'])} products...")
        _bulk(conn, Product, data["products"])

        # Employees must be inserted in level order (exec → mgr → assoc)
        # because of self-referencing FK. We insert all with manager_id=None first,
        # then UPDATE manager_ids, to avoid FK constraint errors.
        print(f"Inserting {len(data['employees'])} employees (two-pass for self-FK)...")
        rows_no_mgr = [{**e, "manager_id": None} for e in data["employees"]]
        _bulk(conn, Employee, rows_no_mgr)

        # Second pass: update manager_ids
        for emp in data["employees"]:
            if emp["manager_id"] is not None:
                conn.execute(
                    text("UPDATE employees SET manager_id = :mid WHERE employee_id = :eid"),
                    {"mid": emp["manager_id"], "eid": emp["employee_id"]},
                )

        print(f"Inserting {len(data['users'])} users...")
        _bulk(conn, User, data["users"])

        print(f"Inserting {len(data['sales'])} sales orders...")
        _bulk(conn, Sale, data["sales"])

        print(f"Inserting {len(data['sale_items'])} sale items...")
        _bulk(conn, SaleItem, data["sale_items"])

        print(f"Inserting {len(data['inventory'])} inventory records...")
        _bulk(conn, Inventory, data["inventory"])

        print(f"Inserting {len(data['stock_movements'])} stock movements...")
        _bulk(conn, StockMovement, data["stock_movements"])

        print(f"Inserting {len(data['targets'])} targets...")
        _bulk(conn, Target, data["targets"])

        print(f"Inserting {len(data['expenses'])} expense records...")
        _bulk(conn, Expense, data["expenses"])

        # Reset sequences so next inserts get correct auto-increment values
        for tbl, col in [
            ("departments", "department_id"), ("regions", "region_id"),
            ("categories", "category_id"),   ("products", "product_id"),
            ("employees", "employee_id"),     ("users", "user_id"),
            ("sales", "sale_id"),             ("sale_items", "sale_item_id"),
            ("inventory", "inventory_id"),    ("stock_movements", "movement_id"),
            ("targets", "target_id"),         ("expenses", "expense_id"),
        ]:
            _reset_seq(conn, tbl, col)

        # Refresh materialized view now that data is present
        print("Refreshing mvw_daily_sales_summary...")
        conn.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY mvw_daily_sales_summary"))

    _print_summary(data)


def _print_summary(data: dict) -> None:
    from collections import Counter

    completed_sales = [s for s in data["sales"] if s["status"] == "completed"]
    total_revenue   = sum(float(s["total_amount"]) for s in completed_sales)
    active_emps     = [e for e in data["employees"] if e["status"] == "active"]
    exited_emps     = [e for e in data["employees"] if e["status"] != "active"]

    dept_exit_counts = Counter(
        e["department_id"] for e in exited_emps
    )
    from seed.generate_data import DEPT_CONFIG
    dept_name = {d[0]: d[1] for d in DEPT_CONFIG}

    inv_data = data["inventory"]
    out_of_stock = sum(1 for i in inv_data if i["quantity_on_hand"] == 0)

    print("\n" + "=" * 60)
    print("  NEXORA ANALYTICS — SEED SUMMARY")
    print("=" * 60)
    print(f"  Departments      : {len(data['departments'])}")
    print(f"  Regions          : {len(data['regions'])}")
    print(f"  Categories       : {len(data['categories'])}")
    print(f"  Products         : {len(data['products'])}")
    print(f"  Employees total  : {len(data['employees'])} ({len(active_emps)} active, {len(exited_emps)} exited)")
    print(f"  Sales orders     : {len(data['sales'])} ({len(completed_sales)} completed)")
    print(f"  Sale items       : {len(data['sale_items'])}")
    print(f"  Total revenue    : ₹{total_revenue/1e7:.2f} Cr (completed orders)")
    print(f"  Avg order value  : ₹{total_revenue/max(len(completed_sales),1)/1000:.1f}k")
    print(f"  Targets          : {len(data['targets'])}")
    print(f"  Stock movements  : {len(data['stock_movements'])}")
    print(f"  Expenses         : {len(data['expenses'])}")
    print(f"  Out of stock     : {out_of_stock} products")
    print()
    print("  Attrition by department:")
    for dept_id, count in sorted(dept_exit_counts.items()):
        print(f"    {dept_name.get(dept_id, dept_id):<25} {count} exits")
    print()
    print("  Demo credentials:")
    print("    admin@nexora.dev     / Admin@123    (admin)")
    print("    analyst@nexora.dev   / Analyst@123  (analyst)")
    print("    manager@nexora.dev   / Manager@123  (manager)")
    print("    employee@nexora.dev  / Employee@123 (employee)")
    print("=" * 60)


if __name__ == "__main__":
    seed()
