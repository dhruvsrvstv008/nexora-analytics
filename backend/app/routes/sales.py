from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.services import sales_service

router = APIRouter()
_ROLES = ("admin", "manager", "analyst")


def _mgr_scope(current_user, manager_id):
    """Managers can only see their own team; enforce in the query layer."""
    if current_user.role == "manager" and current_user.employee_id:
        return current_user.employee_id
    return manager_id


@router.get("/summary", summary="Sales KPIs with period-over-period deltas")
def summary(
    year:          int | None = Query(None),
    month:         int | None = Query(None),
    department_id: int | None = Query(None),
    region_id:     int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return sales_service.get_summary(db, year=year, month=month,
                                     department_id=department_id, region_id=region_id)


@router.get("/trend", summary="Monthly revenue + profit with MoM growth")
def trend(
    year:          int | None = Query(None),
    department_id: int | None = Query(None),
    region_id:     int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return sales_service.get_monthly_trend(db, year=year,
                                           department_id=department_id, region_id=region_id)


@router.get("/by-dimension", summary="Sales grouped by department | employee | manager | product | category | region")
def by_dimension(
    dim:           str       = Query("department", pattern="^(department|employee|manager|product|category|region)$"),
    year:          int | None = Query(None),
    month:         int | None = Query(None),
    department_id: int | None = Query(None),
    manager_id:    int | None = Query(None),
    category_id:   int | None = Query(None),
    region_id:     int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    scoped_mgr = _mgr_scope(current_user, manager_id)

    dispatch = {
        "department": lambda: sales_service.get_by_department(db, year=year, month=month, region_id=region_id),
        "employee":   lambda: sales_service.get_by_employee(db, year=year, month=month,
                                                            department_id=department_id,
                                                            manager_id=scoped_mgr, region_id=region_id),
        "manager":    lambda: sales_service.get_by_manager(db, year=year, month=month, department_id=department_id),
        "product":    lambda: sales_service.get_by_product(db, year=year, month=month,
                                                           category_id=category_id, department_id=department_id),
        "category":   lambda: sales_service.get_by_category(db, year=year, month=month, department_id=department_id),
        "region":     lambda: sales_service.get_by_region(db, year=year, month=month, department_id=department_id),
    }
    return dispatch[dim]()


@router.get("/targets", summary="Target vs actual with achievement % and performance tier")
def targets(
    year:          int | None = Query(None),
    month:         int | None = Query(None),
    department_id: int | None = Query(None),
    manager_id:    int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    scoped_mgr = _mgr_scope(current_user, manager_id)
    return sales_service.get_targets(db, year=year, month=month,
                                     department_id=department_id, manager_id=scoped_mgr)


@router.get("/orders", summary="Paginated order feed")
def orders(
    year:          int | None = Query(None),
    month:         int | None = Query(None),
    department_id: int | None = Query(None),
    region_id:     int | None = Query(None),
    status:        str | None = Query(None, pattern="^(completed|pending|cancelled|returned)$"),
    limit:         int        = Query(50, ge=1, le=200),
    offset:        int        = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return sales_service.get_orders(db, year=year, month=month,
                                    department_id=department_id, region_id=region_id,
                                    status=status, limit=limit, offset=offset)


@router.get("/top-products", summary="Top 10 products by revenue with RANK and DENSE_RANK")
def top_products(
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return sales_service.get_top_products(db, year=year)


@router.get("/top-per-category", summary="Top 3 products per category (ROW_NUMBER PARTITION BY)")
def top_per_category(
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return sales_service.get_top_per_category(db, year=year)
