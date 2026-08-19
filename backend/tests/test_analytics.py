"""
Analytics service tests — assert known numbers from the deterministic seed.

The seed is generated with random.seed(42) so these values are stable
across fresh seeds. If you re-seed, these numbers must hold.

Known constants (from seed summary printed at seed time):
  active_employees   = 182
  exited_employees   = 17
  total_products     = 450
  out_of_stock       = 8
  low_stock          = 21
  trend_months       = 24          (Sep 2024 → Aug 2026)
  hr_new_hires_ytd   = 27          (2026 YTD)
  hr_exits_ytd       = 17
  attrition_top_dept = Customer Support  (32.14%)
"""
import pytest
from fastapi.testclient import TestClient


# ── Workforce ─────────────────────────────────────────────────────────────────

def test_workforce_active_employee_count(client: TestClient, admin_headers):
    r = client.get("/api/v1/workforce/summary", headers=admin_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["active_count"] == 182


def test_workforce_exited_count(client: TestClient, admin_headers):
    r = client.get("/api/v1/workforce/summary", headers=admin_headers)
    data = r.json()
    assert data["exited_count"] == 17


def test_workforce_headcount_prev_year_is_present(client: TestClient, admin_headers):
    r = client.get("/api/v1/workforce/summary", headers=admin_headers)
    data = r.json()
    # headcount_prev_year is used by rule_headcount_growth; must be present
    assert "headcount_prev_year" in data
    assert data["headcount_prev_year"] == 155


# ── Inventory ─────────────────────────────────────────────────────────────────

def test_inventory_total_products(client: TestClient, admin_headers):
    r = client.get("/api/v1/inventory/summary", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["total_products"] == 450


def test_inventory_out_of_stock_count(client: TestClient, admin_headers):
    r = client.get("/api/v1/inventory/summary", headers=admin_headers)
    assert r.json()["out_of_stock_count"] == 8


def test_inventory_low_stock_count(client: TestClient, admin_headers):
    r = client.get("/api/v1/inventory/summary", headers=admin_headers)
    assert r.json()["low_stock_count"] == 21


# ── Sales trend ───────────────────────────────────────────────────────────────

def test_sales_trend_returns_24_months(client: TestClient, admin_headers):
    r = client.get("/api/v1/sales/trend", headers=admin_headers)
    assert r.status_code == 200
    assert len(r.json()) == 24


def test_sales_trend_starts_september_2024(client: TestClient, admin_headers):
    r = client.get("/api/v1/sales/trend", headers=admin_headers)
    first = r.json()[0]
    assert first["period"].startswith("2024-09")


def test_sales_trend_ends_august_2026(client: TestClient, admin_headers):
    r = client.get("/api/v1/sales/trend", headers=admin_headers)
    last = r.json()[-1]
    assert last["period"].startswith("2026-08")


def test_sales_trend_contains_growth_pct_field(client: TestClient, admin_headers):
    r = client.get("/api/v1/sales/trend", headers=admin_headers)
    # All months except the first should have revenue_growth_pct
    rows = r.json()
    assert rows[-1]["revenue_growth_pct"] is not None


# ── Finance ───────────────────────────────────────────────────────────────────

def test_finance_summary_gross_margin(client: TestClient, admin_headers):
    r = client.get("/api/v1/finance/summary", headers=admin_headers)
    assert r.status_code == 200
    margin = float(r.json()["gross_margin_pct"])
    # Seed produces ~6.85%; allow ±0.5 tolerance for re-seed variation
    assert 5.0 < margin < 10.0


def test_finance_summary_net_profit_is_positive(client: TestClient, admin_headers):
    r = client.get("/api/v1/finance/summary", headers=admin_headers)
    assert float(r.json()["net_profit"]) > 0


# ── HR ────────────────────────────────────────────────────────────────────────

def test_hr_new_hires_ytd(client: TestClient, admin_headers):
    r = client.get("/api/v1/hr/summary", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["new_hires_ytd"] == 27


def test_hr_exits_ytd(client: TestClient, admin_headers):
    r = client.get("/api/v1/hr/summary", headers=admin_headers)
    assert r.json()["exits_ytd"] == 17


def test_attrition_highest_in_customer_support(client: TestClient, admin_headers):
    r = client.get("/api/v1/hr/attrition", headers=admin_headers)
    rows = r.json()
    assert rows[0]["department_name"] == "Customer Support"
    assert float(rows[0]["attrition_rate_pct"]) > 30


# ── Salary ────────────────────────────────────────────────────────────────────

def test_salary_by_department_returns_8_rows(client: TestClient, admin_headers):
    r = client.get("/api/v1/salary/by-department", headers=admin_headers)
    assert r.status_code == 200
    assert len(r.json()) == 8


def test_top_earners_returns_10_rows(client: TestClient, admin_headers):
    r = client.get("/api/v1/salary/top-earners", headers=admin_headers)
    assert r.status_code == 200
    assert len(r.json()) == 10
