"""
RBAC enforcement tests.

These tests prove that role restrictions are enforced in the backend,
not just hidden in the UI. A manager calling /salary/top-earners must
get 403 regardless of what the frontend shows.
"""
import pytest
from fastapi.testclient import TestClient


# ── /salary endpoints (admin-only for individual records) ─────────────────────

def test_manager_cannot_view_top_earners(client: TestClient, manager_headers):
    r = client.get("/api/v1/salary/top-earners", headers=manager_headers)
    assert r.status_code == 403


def test_employee_cannot_view_top_earners(client: TestClient, employee_headers):
    r = client.get("/api/v1/salary/top-earners", headers=employee_headers)
    assert r.status_code == 403


def test_analyst_cannot_view_top_earners(client: TestClient, analyst_headers):
    # Individual salary records are admin-only
    r = client.get("/api/v1/salary/top-earners", headers=analyst_headers)
    assert r.status_code == 403


def test_admin_can_view_top_earners(client: TestClient, admin_headers):
    r = client.get("/api/v1/salary/top-earners", headers=admin_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ── /admin endpoint (admin-only) ──────────────────────────────────────────────

def test_analyst_cannot_refresh_materialized_views(client: TestClient, analyst_headers):
    r = client.post("/api/v1/admin/refresh-materialized-views", headers=analyst_headers)
    assert r.status_code == 403


def test_manager_cannot_refresh_materialized_views(client: TestClient, manager_headers):
    r = client.post("/api/v1/admin/refresh-materialized-views", headers=manager_headers)
    assert r.status_code == 403


# ── /finance (admin + analyst only) ──────────────────────────────────────────

def test_manager_cannot_view_finance(client: TestClient, manager_headers):
    r = client.get("/api/v1/finance/summary", headers=manager_headers)
    assert r.status_code == 403


def test_employee_cannot_view_finance(client: TestClient, employee_headers):
    r = client.get("/api/v1/finance/summary", headers=employee_headers)
    assert r.status_code == 403


def test_analyst_can_view_finance(client: TestClient, analyst_headers):
    r = client.get("/api/v1/finance/summary", headers=analyst_headers)
    assert r.status_code == 200


# ── analytics routes (employee cannot access) ─────────────────────────────────

def test_employee_cannot_view_sales_summary(client: TestClient, employee_headers):
    r = client.get("/api/v1/sales/summary", headers=employee_headers)
    assert r.status_code == 403


def test_employee_cannot_view_workforce(client: TestClient, employee_headers):
    r = client.get("/api/v1/workforce/summary", headers=employee_headers)
    assert r.status_code == 403


def test_analyst_can_view_workforce(client: TestClient, analyst_headers):
    r = client.get("/api/v1/workforce/summary", headers=analyst_headers)
    assert r.status_code == 200


def test_unauthenticated_cannot_access_any_route(client: TestClient):
    for path in ["/api/v1/sales/summary", "/api/v1/workforce/summary", "/api/v1/finance/summary"]:
        r = client.get(path)
        assert r.status_code == 401, f"Expected 401 for unauthenticated {path}, got {r.status_code}"


# ── Manager team scoping (sales by-dimension) ─────────────────────────────────
# Manager user = user_id 3, employee_id 5 ("Ayushman Chander").
# _mgr_scope forces manager_id = employee_id so they only see their own team.

def test_manager_sees_only_own_team_employees(client: TestClient, manager_headers, admin_headers):
    mgr = client.get("/api/v1/sales/by-dimension?dim=employee", headers=manager_headers)
    admin = client.get("/api/v1/sales/by-dimension?dim=employee", headers=admin_headers)
    assert mgr.status_code == 200
    # Manager sees a strict subset of what admin sees
    assert len(mgr.json()) < len(admin.json())


def test_manager_team_row_count_is_exact(client: TestClient, manager_headers):
    r = client.get("/api/v1/sales/by-dimension?dim=employee", headers=manager_headers)
    assert len(r.json()) == 12


def test_manager_team_all_rows_belong_to_their_manager(client: TestClient, manager_headers):
    rows = client.get("/api/v1/sales/by-dimension?dim=employee", headers=manager_headers).json()
    manager_names = {row["manager_name"] for row in rows}
    assert manager_names == {"Ayushman Chander"}


def test_manager_cannot_override_own_scope_with_query_param(client: TestClient, manager_headers, admin_headers):
    # Manager passes manager_id=1 (a different manager); scoping must ignore it
    # and still return only their own team (12 rows), not the other manager's team.
    admin_all = client.get("/api/v1/sales/by-dimension?dim=employee", headers=admin_headers)
    mgr_spoofed = client.get("/api/v1/sales/by-dimension?dim=employee&manager_id=1", headers=manager_headers)
    assert mgr_spoofed.status_code == 200
    # Must still be scoped to their team, not the full dataset or manager 1's team
    assert len(mgr_spoofed.json()) == 12
