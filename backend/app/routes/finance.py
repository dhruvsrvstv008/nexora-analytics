from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.services import finance_service
from app.insights.rules import generate_finance_insights

router = APIRouter()
_ROLES = ("admin", "analyst")


@router.get("/summary", summary="Revenue, expenses, profit, and margin KPIs")
def summary(
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return finance_service.get_summary(db, year=year)


@router.get("/revenue-vs-expenses", summary="Monthly revenue vs expenses vs profit trend")
def revenue_vs_expenses(
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return finance_service.get_monthly_trend(db, year=year)


@router.get("/department-costs", summary="Cost breakdown per department by expense category")
def department_costs(
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return finance_service.get_department_costs(db, year=year)


@router.get("/dept-pnl", summary="Department P&L with FULL OUTER JOIN (revenue vs all costs)")
def dept_pnl(
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return finance_service.get_dept_pnl(db, year=year)


@router.get("/insights", summary="Rule-based finance insights")
def insights(
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    """Deterministic rule-based insights for the finance domain — no AI/LLM."""
    fin_sum = finance_service.get_summary(db, year=year)
    payroll = float(fin_sum.get("total_expenses") or 0)
    revenue = float(fin_sum.get("revenue") or 0)
    return generate_finance_insights(fin_summary=fin_sum, payroll=payroll, revenue=revenue)
