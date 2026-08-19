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
        # 401 = no credentials supplied (HTTPBearer); 403 = wrong role — both block access
        assert r.status_code in (401, 403), f"Expected 401/403 for unauthenticated {path}, got {r.status_code}"
