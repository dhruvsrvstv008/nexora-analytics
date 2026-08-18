from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.services import hr_service

router = APIRouter()
_ROLES = ("admin", "manager", "analyst")


@router.get("/summary", summary="Hiring rate, attrition rate, avg tenure KPIs")
def summary(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return hr_service.get_summary(db)


@router.get("/hiring-trend", summary="New hires per month with cumulative headcount")
def hiring_trend(
    department_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return hr_service.get_hiring_trend(db, department_id=department_id)


@router.get("/attrition", summary="Attrition rate and exit breakdown per department")
def attrition(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return hr_service.get_attrition(db)


@router.get("/tenure", summary="Tenure distribution with bucket classification")
def tenure(
    department_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    rows = hr_service.get_tenure(db, department_id=department_id)
    # Analysts don't see individual names
    if current_user.role == "analyst":
        return [{"tenure_months": r["tenure_months"], "tenure_bucket": r["tenure_bucket"],
                 "department_name": r["department_name"], "job_level": r["job_level"],
                 "status": r["status"]}
                for r in rows]
    return rows
