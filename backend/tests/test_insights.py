"""
Insights engine tests — shape, severity enum, and known-data assertions.

Rules are deterministic Python functions. These tests verify:
  1. All 6 endpoints return a list of correctly shaped dicts.
  2. severity values are restricted to the defined enum.
  3. Known patterns in the seed data trigger the expected rules.
"""
import pytest
from fastapi.testclient import TestClient

VALID_SEVERITIES = {"critical", "warning", "positive", "neutral"}
REQUIRED_FIELDS = {"severity", "category", "message", "metric_value"}

INSIGHT_ENDPOINTS = [
    "/api/v1/executive/insights",
    "/api/v1/sales/insights",
    "/api/v1/inventory/insights",
    "/api/v1/workforce/insights",
    "/api/v1/finance/insights",
    "/api/v1/hr/insights",
    "/api/v1/salary/insights",
]


def test_all_insight_endpoints_return_200(client: TestClient, admin_headers):
    for ep in INSIGHT_ENDPOINTS:
        r = client.get(ep, headers=admin_headers)
        assert r.status_code == 200, f"{ep} returned {r.status_code}: {r.text}"


def test_all_insight_endpoints_return_lists(client: TestClient, admin_headers):
    for ep in INSIGHT_ENDPOINTS:
        data = client.get(ep, headers=admin_headers).json()
        assert isinstance(data, list), f"{ep} should return a list"


def test_all_insights_have_required_fields(client: TestClient, admin_headers):
    for ep in INSIGHT_ENDPOINTS:
        for insight in client.get(ep, headers=admin_headers).json():
            missing = REQUIRED_FIELDS - set(insight.keys())
            assert not missing, f"{ep} insight missing fields: {missing}\n  {insight}"


def test_all_severity_values_are_valid(client: TestClient, admin_headers):
    for ep in INSIGHT_ENDPOINTS:
        for insight in client.get(ep, headers=admin_headers).json():
            assert insight["severity"] in VALID_SEVERITIES, (
                f"{ep}: invalid severity '{insight['severity']}'"
            )


# ── Known-data assertions ─────────────────────────────────────────────────────

def test_inventory_insights_include_out_of_stock_critical(client: TestClient, admin_headers):
    insights = client.get("/api/v1/inventory/insights", headers=admin_headers).json()
    criticals = [i for i in insights if i["severity"] == "critical"]
    assert criticals, "Inventory insights should have at least one critical (8 products OOS)"
    messages = " ".join(i["message"] for i in criticals)
    assert "out of stock" in messages.lower()


def test_workforce_insights_flag_customer_support_attrition(client: TestClient, admin_headers):
    insights = client.get("/api/v1/workforce/insights", headers=admin_headers).json()
    attrition = [i for i in insights if "Customer Support" in i["message"] and "attrition" in i["message"].lower()]
    assert attrition, "Workforce insights should flag Customer Support's 32% attrition"
    assert attrition[0]["severity"] == "critical"


def test_workforce_insights_flag_headcount_growth(client: TestClient, admin_headers):
    insights = client.get("/api/v1/workforce/insights", headers=admin_headers).json()
    growth = [i for i in insights if "headcount" in i["message"].lower() or "year-over-year" in i["message"].lower()]
    assert growth, "Workforce insights should include headcount growth"
    assert growth[0]["severity"] == "positive"


def test_hr_insights_flag_customer_support_attrition(client: TestClient, admin_headers):
    insights = client.get("/api/v1/hr/insights", headers=admin_headers).json()
    attrition = [i for i in insights if "Customer Support" in i["message"]]
    assert attrition, "HR insights should flag Customer Support attrition"


def test_hr_insights_flag_net_hiring(client: TestClient, admin_headers):
    insights = client.get("/api/v1/hr/insights", headers=admin_headers).json()
    hiring = [i for i in insights if "hires" in i["message"].lower() or "exits" in i["message"].lower()]
    assert hiring, "HR insights should compare hires vs exits (27 vs 17)"


def test_executive_insights_capped_at_6(client: TestClient, admin_headers):
    insights = client.get("/api/v1/executive/insights", headers=admin_headers).json()
    assert len(insights) <= 6, f"Executive feed must be capped at 6, got {len(insights)}"


def test_executive_insights_sorted_by_severity(client: TestClient, admin_headers):
    order = {"critical": 0, "warning": 1, "positive": 2, "neutral": 3}
    insights = client.get("/api/v1/executive/insights", headers=admin_headers).json()
    ranks = [order[i["severity"]] for i in insights]
    assert ranks == sorted(ranks), "Executive insights must be sorted critical → warning → positive → neutral"


def test_salary_insights_flag_pay_spread(client: TestClient, admin_headers):
    insights = client.get("/api/v1/salary/insights", headers=admin_headers).json()
    spread = [i for i in insights if "pay equity" in i["message"].lower() or "×" in i["message"]]
    assert spread, "Salary insights should flag the pay spread between departments"


def test_finance_insights_flag_low_gross_margin(client: TestClient, admin_headers):
    insights = client.get("/api/v1/finance/insights", headers=admin_headers).json()
    margin = [i for i in insights if "margin" in i["message"].lower()]
    assert margin, "Finance insights should flag low gross margin (6.8%)"
    assert margin[0]["severity"] == "warning"


# ── Analyst cannot see salary insights (admin + analyst only) ─────────────────

def test_analyst_can_see_salary_insights(client: TestClient, analyst_headers):
    r = client.get("/api/v1/salary/insights", headers=analyst_headers)
    assert r.status_code == 200


def test_manager_cannot_see_finance_insights(client: TestClient, manager_headers):
    r = client.get("/api/v1/finance/insights", headers=manager_headers)
    assert r.status_code == 403
