"""Auth flow tests — login, /me, token refresh."""
import pytest
from fastapi.testclient import TestClient


def test_login_returns_tokens(client: TestClient):
    r = client.post("/api/v1/auth/login", json={"email": "admin@nexora.dev", "password": "Admin@123"})
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


def test_login_wrong_password_is_401(client: TestClient):
    r = client.post("/api/v1/auth/login", json={"email": "admin@nexora.dev", "password": "wrong"})
    assert r.status_code == 401


def test_login_unknown_email_is_401(client: TestClient):
    r = client.post("/api/v1/auth/login", json={"email": "ghost@nexora.dev", "password": "any"})
    assert r.status_code == 401


def test_me_returns_correct_role(client: TestClient, admin_headers):
    r = client.get("/api/v1/auth/me", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


def test_me_analyst_role(client: TestClient, analyst_headers):
    r = client.get("/api/v1/auth/me", headers=analyst_headers)
    assert r.status_code == 200
    assert r.json()["role"] == "analyst"


def test_me_without_token_is_401(client: TestClient):
    r = client.get("/api/v1/auth/me")
    assert r.status_code == 401


def test_refresh_produces_new_access_token(client: TestClient):
    login = client.post("/api/v1/auth/login", json={"email": "analyst@nexora.dev", "password": "Analyst@123"})
    refresh_token = login.json()["refresh_token"]

    r = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_expired_or_garbage_token_is_401(client: TestClient):
    r = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not.a.real.token"})
    assert r.status_code == 401
