from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role

router = APIRouter()


@router.post("/refresh-materialized-views", summary="Refresh mvw_daily_sales_summary (admin only)")
def refresh_materialized_views(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    """
    Refreshes the mvw_daily_sales_summary materialized view.
    This is intentionally manual — materialised views trade freshness for query speed.
    In production this would be triggered by a scheduled job or a post-ETL hook.
    """
    db.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY mvw_daily_sales_summary"))
    db.commit()
    return {"status": "ok", "message": "mvw_daily_sales_summary refreshed successfully"}
