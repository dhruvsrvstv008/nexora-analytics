from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.services import workforce_service

router = APIRouter()
_ROLES = ("admin", "manager", "analyst")


@router.get("/summary", summary="Workforce headcount KPIs")
def summary(
    department_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return workforce_service.get_summary(db, department_id=department_id)


@router.get("/distribution", summary="Headcount by department | level | manager")
def distribution(
    by:            str       = Query("department", pattern="^(department|level|manager)$"),
    department_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return workforce_service.get_distribution(db, group_by=by, department_id=department_id)


@router.get("/headcount-trend", summary="Monthly headcount growth — new hires and exits")
def headcount_trend(
    department_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return workforce_service.get_headcount_trend(db, department_id=department_id)


@router.get("/hierarchy", summary="Org tree from recursive CTE — expandable nodes")
def hierarchy(
    department_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return workforce_service.get_hierarchy(db, department_id=department_id)
