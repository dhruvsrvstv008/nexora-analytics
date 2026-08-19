from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.services import inventory_service
from app.insights.rules import generate_inventory_insights

router = APIRouter()
_ROLES = ("admin", "manager", "analyst")


@router.get("/summary", summary="Inventory KPIs — products, value, alert counts")
def summary(
    category_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return inventory_service.get_summary(db, category_id=category_id)


@router.get("/by-category", summary="Stock value and composition per category")
def by_category(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return inventory_service.get_by_category(db)


@router.get("/alerts", summary="Low stock, out-of-stock, and overstock products")
def alerts(
    alert_type:  str | None = Query(None, pattern="^(low_stock|out_of_stock|overstock)$"),
    category_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return inventory_service.get_alerts(db, alert_type=alert_type, category_id=category_id)


@router.get("/movement-analysis", summary="Velocity, turnover ratio, months-of-cover, risk flags")
def movement_analysis(
    category_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    return inventory_service.get_velocity(db, category_id=category_id)


@router.get("/insights", summary="Rule-based inventory insights")
def insights(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ROLES)),
):
    """Deterministic rule-based insights for the inventory domain — no AI/LLM."""
    inv_sum  = inventory_service.get_summary(db)
    velocity = inventory_service.get_velocity(db)
    return generate_inventory_insights(inv_summary=inv_sum, velocity_data=velocity)
