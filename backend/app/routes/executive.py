from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.schemas.common import kpi
from app.services import sales_service, workforce_service, inventory_service, finance_service, hr_service
from app.insights.rules import generate_executive_insights

router = APIRouter()
_ROLES = ("admin", "manager", "analyst")


@router.get("/overview", summary="Executive dashboard — single payload")
def overview(
    year: int | None = Query(None, description="Filter by calendar year"),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    """
    Returns all KPIs, trends, top managers, recent orders, and alerts
    needed for the executive dashboard in a single request.
    """
    sales_sum  = sales_service.get_summary(db, year=year)
    wf_sum     = workforce_service.get_summary(db)
    inv_sum    = inventory_service.get_summary(db)
    fin_sum    = finance_service.get_summary(db, year=year)
    trend      = sales_service.get_monthly_trend(db, year=year)
    by_dept    = sales_service.get_by_department(db, year=year)
    top_mgrs   = sales_service.get_by_manager(db, year=year)[:5]
    orders     = sales_service.get_orders(db, year=year, limit=10)
    inv_alerts = inventory_service.get_alerts(db)[:12]

    payroll = float(fin_sum.get("total_expenses") or 0)
    revenue = float(sales_sum.get("revenue") or 0)

    return {
        "kpis": {
            "revenue":         kpi(revenue, float(sales_sum.get("prev_revenue") or 0) or None),
            "profit":          kpi(float(sales_sum.get("profit") or 0), float(sales_sum.get("prev_profit") or 0) or None),
            "headcount":       kpi(float(wf_sum.get("active_count") or 0)),
            "inventory_value": kpi(float(inv_sum.get("total_stock_value") or 0)),
        },
        "revenue_trend":      trend,
        "sales_by_department": by_dept,
        "top_managers":        top_mgrs,
        "recent_orders":       orders,
        "inventory_alerts":    inv_alerts,
    }


@router.get("/insights", summary="Rule-based executive insights feed")
def insights(
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    """
    Returns up to 6 prioritised insights (critical → warning → positive → neutral).
    All rules are deterministic — no AI/LLM involved; the value is in the analysis.
    """
    trend        = sales_service.get_monthly_trend(db, year=year)
    dept_data    = sales_service.get_by_department(db, year=year)
    inv_sum      = inventory_service.get_summary(db)
    targets      = sales_service.get_targets(db, year=year)
    salary_data  = workforce_service.get_salary_by_department(db)
    fin_sum      = finance_service.get_summary(db, year=year)
    velocity     = inventory_service.get_velocity(db)
    attrition    = hr_service.get_attrition(db)

    payroll = float(fin_sum.get("total_expenses") or 0)
    revenue = float(fin_sum.get("revenue") or 0)

    return generate_executive_insights(
        trend=trend, dept_data=dept_data, inv_summary=inv_sum,
        targets=targets, salary_data=salary_data,
        payroll=payroll, revenue=revenue,
        velocity_data=velocity, attrition_data=attrition,
    )
