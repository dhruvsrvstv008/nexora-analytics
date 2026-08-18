from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.services import finance_service

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
