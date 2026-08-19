"""
Test fixtures for Nexora Analytics.

Strategy: tests run against the live seeded database (seed is deterministic,
random.seed(42)), so assertions on known numbers are stable across runs.
We inject JWT tokens directly rather than going through bcrypt hashing on
every test to keep the suite fast.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.utils.jwt import create_access_token

# User IDs from the deterministic seed (see seed/seed.py)
_USER_IDS = {
    "admin":    1,
    "analyst":  2,
    "manager":  3,
    "employee": 4,
}


def _auth_header(role: str) -> dict[str, str]:
    token = create_access_token(_USER_IDS[role])
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="session")
def admin_headers() -> dict[str, str]:
    return _auth_header("admin")


@pytest.fixture(scope="session")
def analyst_headers() -> dict[str, str]:
    return _auth_header("analyst")


@pytest.fixture(scope="session")
def manager_headers() -> dict[str, str]:
    return _auth_header("manager")


@pytest.fixture(scope="session")
def employee_headers() -> dict[str, str]:
    return _auth_header("employee")
