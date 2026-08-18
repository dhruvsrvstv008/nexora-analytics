from pydantic import BaseModel
from typing import Any


class KpiValue(BaseModel):
    value: float
    previous_value: float | None = None
    change_pct: float | None = None
    direction: str | None = None  # "up" | "down" | "neutral"


class TrendPoint(BaseModel):
    period: str
    value: float

    model_config = {"from_attributes": True}


class ErrorResponse(BaseModel):
    detail: str
    code: str


def kpi(value: float, prev: float | None = None) -> dict[str, Any]:
    """Build a standard KPI dict with delta and direction."""
    change_pct = None
    direction = "neutral"
    if prev and prev != 0:
        change_pct = round((value - prev) / prev * 100, 2)
        direction = "up" if change_pct > 0 else "down" if change_pct < 0 else "neutral"
    return {
        "value": value,
        "previous_value": prev,
        "change_pct": change_pct,
        "direction": direction,
    }
