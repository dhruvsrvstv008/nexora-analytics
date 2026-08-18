"""
Rule-based insight generator — deterministic Python, no AI/LLM.
Each rule takes computed metrics and returns a structured insight dict.
"""
from typing import Any


def _insight(severity: str, category: str, message: str, metric_value: Any = None) -> dict:
    return {"severity": severity, "category": category, "message": message, "metric_value": metric_value}


def rule_revenue_change(trend: list[dict]) -> dict | None:
    """Flag if month-over-month revenue changed by more than ±5%."""
    if len(trend) < 2:
        return None
    last = trend[-1]
    pct = last.get("revenue_growth_pct")
    if pct is None:
        return None
    if pct >= 5:
        return _insight("positive", "sales", f"Revenue grew {pct:.1f}% MoM — strong momentum.", pct)
    if pct <= -5:
        return _insight("warning", "sales", f"Revenue fell {abs(pct):.1f}% MoM — investigate drivers.", pct)
    return None


def rule_top_department(dept_data: list[dict]) -> dict | None:
    """Identify the highest-contributing department this period."""
    if not dept_data:
        return None
    top = dept_data[0]
    name = top.get("department_name", "Unknown")
    share = top.get("revenue_share_pct", 0)
    return _insight("neutral", "sales", f"{name} leads with {share:.1f}% of total revenue.", share)


def rule_low_stock(inv_summary: dict) -> dict | None:
    """Alert if products below reorder level exceed threshold."""
    low = inv_summary.get("low_stock_count", 0)
    out = inv_summary.get("out_of_stock_count", 0)
    total = low + out
    if out > 0:
        return _insight("critical", "inventory", f"{out} products are out of stock; {low} more are below reorder level.", total)
    if low > 10:
        return _insight("warning", "inventory", f"{low} products are below their reorder threshold.", low)
    return None


def rule_manager_performance(targets: list[dict]) -> list[dict]:
    """Flag managers who consistently exceed 110% or fall below 85% of target."""
    from collections import defaultdict
    mgr_data: dict[str, list[float]] = defaultdict(list)
    for row in targets:
        pct = row.get("achievement_pct")
        name = row.get("manager_name") or row.get("full_name")
        if pct is not None and name:
            mgr_data[name].append(float(pct))

    insights = []
    for mgr, pcts in mgr_data.items():
        avg = sum(pcts) / len(pcts)
        if avg >= 110:
            insights.append(_insight("positive", "performance", f"{mgr} is averaging {avg:.0f}% of target — consistently overachieving.", avg))
        elif avg <= 85:
            insights.append(_insight("warning", "performance", f"{mgr} is averaging {avg:.0f}% of target — needs attention.", avg))
    return insights


def rule_high_salary_dept(salary_data: list[dict]) -> dict | None:
    """Highlight the department with the highest average salary."""
    if not salary_data:
        return None
    top = salary_data[0]
    return _insight(
        "neutral", "hr",
        f"{top.get('department_name')} has the highest avg salary of ₹{top.get('avg_salary', 0):,.0f}/mo.",
        top.get("avg_salary"),
    )


def rule_payroll_vs_revenue(payroll: float, revenue: float) -> dict | None:
    """Warn if payroll exceeds 30% of gross revenue."""
    if revenue <= 0:
        return None
    pct = payroll / revenue * 100
    if pct > 30:
        return _insight("warning", "finance", f"Payroll is {pct:.1f}% of revenue — above the 30% threshold.", round(pct, 1))
    return None


def rule_overstock_stockout(velocity_data: list[dict]) -> dict | None:
    """Count overstock and stockout-risk products from velocity analysis."""
    overstock = sum(1 for r in velocity_data if r.get("risk_flag") == "overstock_risk")
    stockout  = sum(1 for r in velocity_data if r.get("risk_flag") == "stockout_risk")
    if overstock or stockout:
        return _insight(
            "warning", "inventory",
            f"{overstock} products at overstock risk and {stockout} at stockout risk.",
            {"overstock": overstock, "stockout": stockout},
        )
    return None


def rule_attrition(attrition_data: list[dict], threshold: float = 20.0) -> dict | None:
    """Flag any department whose attrition rate exceeds the threshold."""
    high = [r for r in attrition_data if float(r.get("attrition_rate_pct") or 0) >= threshold]
    if high:
        top = high[0]
        return _insight(
            "critical", "hr",
            f"{top['department_name']} has {top['attrition_rate_pct']}% attrition — above {threshold}% threshold.",
            top["attrition_rate_pct"],
        )
    return None


SEVERITY_ORDER = {"critical": 0, "warning": 1, "positive": 2, "neutral": 3}


def generate_executive_insights(
    trend: list[dict],
    dept_data: list[dict],
    inv_summary: dict,
    targets: list[dict],
    salary_data: list[dict],
    payroll: float,
    revenue: float,
    velocity_data: list[dict],
    attrition_data: list[dict],
    cap: int = 6,
) -> list[dict]:
    insights = []

    r = rule_revenue_change(trend)
    if r: insights.append(r)

    r = rule_top_department(dept_data)
    if r: insights.append(r)

    r = rule_low_stock(inv_summary)
    if r: insights.append(r)

    insights.extend(rule_manager_performance(targets))

    r = rule_high_salary_dept(salary_data)
    if r: insights.append(r)

    r = rule_payroll_vs_revenue(payroll, revenue)
    if r: insights.append(r)

    r = rule_overstock_stockout(velocity_data)
    if r: insights.append(r)

    r = rule_attrition(attrition_data)
    if r: insights.append(r)

    insights.sort(key=lambda x: SEVERITY_ORDER.get(x["severity"], 99))
    return insights[:cap]
