from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.services import sales_service, workforce_service

router = APIRouter()
_ROLES = ("admin", "manager", "analyst")


def _assert_manager_access(current_user, manager_id: int):
    """A manager can only view their own team; admins and analysts can view any."""
    if current_user.role == "manager" and current_user.employee_id != manager_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Managers can only view their own team.")


@router.get("", summary="Manager leaderboard ordered by team revenue")
def manager_leaderboard(
    year:          int | None = Query(None),
    month:         int | None = Query(None),
    department_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    if current_user.role == "manager" and current_user.employee_id:
        # Managers see only their own row in the leaderboard
        rows = sales_service.get_by_manager(db, year=year, month=month, department_id=department_id)
        return [r for r in rows if r.get("manager_id") == current_user.employee_id]
    return sales_service.get_by_manager(db, year=year, month=month, department_id=department_id)


@router.get("/{manager_id}/overview", summary="Single manager team KPIs")
def manager_overview(
    manager_id: int,
    year:       int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    _assert_manager_access(current_user, manager_id)
    return workforce_service.get_manager_overview(db, manager_id=manager_id, year=year)


@router.get("/{manager_id}/team", summary="Per-employee sales vs target for a manager's team")
def manager_team(
    manager_id: int,
    year:       int | None = Query(None),
    month:      int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    _assert_manager_access(current_user, manager_id)
    return sales_service.get_targets(db, year=year, month=month, manager_id=manager_id)
