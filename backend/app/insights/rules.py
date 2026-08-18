"""
Rule-based insight generator — deterministic Python, no AI/LLM.

Design principle: each rule takes already-computed SQL metrics and returns a
structured insight dict. Rules are pure functions with no DB access.
This makes them trivially testable and completely transparent.
"""
from collections import defaultdict
from typing import Any


# ─── Insight factory ──────────────────────────────────────────────────────────

def _insight(severity: str, category: str, message: str, metric_value: Any = None) -> dict:
    return {"severity": severity, "category": category, "message": message, "metric_value": metric_value}

SEVERITY_ORDER = {"critical": 0, "warning": 1, "positive": 2, "neutral": 3}


# ══════════════════════════════════════════════════════════════════════════════
# SALES RULES
# ══════════════════════════════════════════════════════════════════════════════

def rule_revenue_change(trend: list[dict]) -> dict | None:
    """Flag if month-over-month revenue changed by more than ±5%."""
    if len(trend) < 2:
        return None
    pct = trend[-1].get("revenue_growth_pct")
    if pct is None:
        return None
    if pct >= 10:
        return _insight("positive", "sales", f"Revenue surged {pct:.1f}% MoM — best-performing period.", pct)
    if pct >= 5:
        return _insight("positive", "sales", f"Revenue grew {pct:.1f}% MoM — maintaining positive momentum.", pct)
    if pct <= -10:
        return _insight("critical", "sales", f"Revenue dropped {abs(pct):.1f}% MoM — requires immediate attention.", pct)
    if pct <= -5:
        return _insight("warning", "sales", f"Revenue fell {abs(pct):.1f}% MoM — investigate drivers.", pct)
    return None


def rule_top_department(dept_data: list[dict]) -> dict | None:
    """Identify the highest-contributing department this period."""
    if not dept_data:
        return None
    top = dept_data[0]
    share = top.get("revenue_share_pct", 0)
    return _insight("neutral", "sales", f"{top.get('department_name')} leads with {share:.1f}% of revenue.", share)


def rule_manager_performance(targets: list[dict]) -> list[dict]:
    """Flag managers above 110% (positive) or below 85% (warning) of target average."""
    mgr_pcts: dict[str, list[float]] = defaultdict(list)
    for row in targets:
        pct  = row.get("achievement_pct")
        name = row.get("manager_name") or row.get("full_name")
        if pct is not None and name:
            mgr_pcts[name].append(float(pct))

    out = []
    for mgr, pcts in mgr_pcts.items():
        avg = sum(pcts) / len(pcts)
        if avg >= 110:
            out.append(_insight("positive", "performance", f"{mgr} averaging {avg:.0f}% of target — consistently overachieving.", avg))
        elif avg <= 85:
            out.append(_insight("warning", "performance", f"{mgr} averaging {avg:.0f}% of target — underperforming.", avg))
    return out


def rule_revenue_streak(trend: list[dict]) -> dict | None:
    """Detect 3+ consecutive months of growth or decline."""
    if len(trend) < 3:
        return None
    recent = [t.get("revenue_growth_pct") for t in trend[-3:] if t.get("revenue_growth_pct") is not None]
    if len(recent) < 3:
        return None
    if all(r > 0 for r in recent):
        return _insight("positive", "sales", f"Three consecutive months of revenue growth — sustained upward trend.", recent[-1])
    if all(r < 0 for r in recent):
        return _insight("critical", "sales", f"Three consecutive months of revenue decline — pattern requires review.", recent[-1])
    return None


def rule_aov_change(trend: list[dict]) -> dict | None:
    """Flag if average order value has shifted significantly vs prior month."""
    if len(trend) < 2:
        return None
    curr_rev    = float(trend[-1].get("revenue") or 0)
    curr_orders = float(trend[-1].get("order_count") or 1)
    prev_rev    = float(trend[-2].get("revenue") or 0)
    prev_orders = float(trend[-2].get("order_count") or 1)
    if curr_orders == 0 or prev_orders == 0:
        return None
    curr_aov = curr_rev / curr_orders
    prev_aov = prev_rev / prev_orders
    if prev_aov == 0:
        return None
    change = (curr_aov - prev_aov) / prev_aov * 100
    if change >= 15:
        return _insight("positive", "sales", f"Average order value rose {change:.1f}% — customers are buying higher-value items.", round(change, 1))
    if change <= -15:
        return _insight("warning", "sales", f"Average order value fell {abs(change):.1f}% — possible discounting or mix shift.", round(change, 1))
    return None


# ══════════════════════════════════════════════════════════════════════════════
# INVENTORY RULES
# ══════════════════════════════════════════════════════════════════════════════

def rule_low_stock(inv_summary: dict) -> dict | None:
    """Alert when products are out of stock or critically below reorder level."""
    out = inv_summary.get("out_of_stock_count", 0)
    low = inv_summary.get("low_stock_count", 0)
    if out > 0:
        return _insight("critical", "inventory", f"{out} products out of stock; {low} more below reorder threshold — act now.", out + low)
    if low > 15:
        return _insight("warning", "inventory", f"{low} products below reorder level — restocking needed.", low)
    if low > 5:
        return _insight("neutral", "inventory", f"{low} products approaching reorder level.", low)
    return None


def rule_overstock_stockout(velocity_data: list[dict]) -> dict | None:
    """Report products at overstock and stockout risk from velocity analysis."""
    overstock = sum(1 for r in velocity_data if r.get("risk_flag") == "overstock_risk")
    stockout  = sum(1 for r in velocity_data if r.get("risk_flag") == "stockout_risk")
    if stockout > 0 and overstock > 0:
        return _insight("warning", "inventory", f"{stockout} products at stockout risk and {overstock} at overstock risk — rebalance inventory.", {"overstock": overstock, "stockout": stockout})
    if stockout > 0:
        return _insight("warning", "inventory", f"{stockout} fast-moving products approaching stockout — increase reorder frequency.", stockout)
    if overstock > 0:
        return _insight("neutral", "inventory", f"{overstock} products have excess stock (>12 months cover) — consider promotions.", overstock)
    return None


def rule_dead_stock(velocity_data: list[dict]) -> dict | None:
    """Identify very slow-moving (dead stock) products."""
    dead = sum(1 for r in velocity_data if r.get("velocity_label") == "Very Slow / Dead Stock" and r.get("avg_monthly_outbound", 0) == 0)
    if dead >= 5:
        return _insight("warning", "inventory", f"{dead} products have had no sales movement — potential dead stock.", dead)
    return None


# ══════════════════════════════════════════════════════════════════════════════
# WORKFORCE & HR RULES
# ══════════════════════════════════════════════════════════════════════════════

def rule_attrition(attrition_data: list[dict], threshold: float = 20.0) -> dict | None:
    """Flag departments whose attrition rate exceeds the threshold."""
    high = sorted(
        [r for r in attrition_data if float(r.get("attrition_rate_pct") or 0) >= threshold],
        key=lambda r: -float(r.get("attrition_rate_pct") or 0),
    )
    if not high:
        return None
    top = high[0]
    rate = float(top.get("attrition_rate_pct") or 0)
    extra = f" (+{len(high)-1} more)" if len(high) > 1 else ""
    return _insight("critical", "hr", f"{top['department_name']} has {rate:.0f}% attrition — above the {threshold:.0f}% threshold{extra}.", rate)


def rule_headcount_growth(wf_summary: dict) -> dict | None:
    """Compare current headcount to prior year and flag changes."""
    active = wf_summary.get("active_count", 0)
    prev   = wf_summary.get("headcount_prev_year", 0)
    if not prev:
        return None
    pct = (active - prev) / prev * 100
    if pct >= 15:
        return _insight("positive", "workforce", f"Headcount grew {pct:.1f}% year-over-year — strong expansion phase.", round(pct, 1))
    if pct >= 5:
        return _insight("neutral", "workforce", f"Headcount up {pct:.1f}% year-over-year.", round(pct, 1))
    if pct < 0:
        return _insight("warning", "workforce", f"Headcount shrank {abs(pct):.1f}% year-over-year — net negative hiring.", round(pct, 1))
    return None


def rule_hires_vs_exits(hr_summary: dict) -> dict | None:
    """Warn when YTD exits exceed new hires."""
    hires = hr_summary.get("new_hires_ytd", 0)
    exits = hr_summary.get("exits_ytd", 0)
    if exits > hires and exits > 0:
        return _insight("warning", "hr", f"Exits ({exits}) exceed new hires ({hires}) YTD — net headcount is shrinking.", exits - hires)
    if hires >= 15:
        return _insight("positive", "hr", f"{hires} new hires YTD vs {exits} exits — net growth of {hires - exits}.", hires - exits)
    return None


def rule_high_salary_dept(salary_data: list[dict]) -> dict | None:
    """Surface the highest-paid department for budget awareness."""
    if not salary_data:
        return None
    top = salary_data[0]
    return _insight("neutral", "hr", f"{top.get('department_name')} has the highest avg salary at ₹{float(top.get('avg_salary', 0)):,.0f}/mo.", top.get("avg_salary"))


# ══════════════════════════════════════════════════════════════════════════════
# FINANCE RULES
# ══════════════════════════════════════════════════════════════════════════════

def rule_payroll_vs_revenue(payroll: float, revenue: float) -> dict | None:
    """Warn if total expenses exceed 30% of revenue."""
    if revenue <= 0:
        return None
    pct = payroll / revenue * 100
    if pct > 40:
        return _insight("critical", "finance", f"Operating expenses are {pct:.1f}% of revenue — severely above the 30% benchmark.", round(pct, 1))
    if pct > 30:
        return _insight("warning", "finance", f"Operating expenses are {pct:.1f}% of revenue — above the 30% benchmark.", round(pct, 1))
    return None


def rule_profit_margin(fin_summary: dict) -> dict | None:
    """Report gross margin health."""
    margin = float(fin_summary.get("gross_margin_pct") or 0)
    if margin <= 0:
        return None
    if margin >= 30:
        return _insight("positive", "finance", f"Gross margin of {margin:.1f}% is healthy for B2B distribution.", margin)
    if margin < 15:
        return _insight("warning", "finance", f"Gross margin is {margin:.1f}% — below the 15% threshold for sustainability.", margin)
    return None


def rule_net_profit(fin_summary: dict) -> dict | None:
    """Flag if net profit is negative."""
    net = float(fin_summary.get("net_profit") or 0)
    revenue = float(fin_summary.get("revenue") or 0)
    if revenue <= 0:
        return None
    if net < 0:
        return _insight("critical", "finance", f"Net profit is negative (₹{net:,.0f}) — operating at a loss this period.", net)
    margin = net / revenue * 100
    if margin >= 10:
        return _insight("positive", "finance", f"Net margin is {margin:.1f}% — efficient cost management.", round(margin, 1))
    return None


# ══════════════════════════════════════════════════════════════════════════════
# COMPOSERS — one per module
# ══════════════════════════════════════════════════════════════════════════════

def _sort_cap(insights: list[dict], cap: int) -> list[dict]:
    insights.sort(key=lambda x: SEVERITY_ORDER.get(x["severity"], 99))
    return insights[:cap]


def generate_executive_insights(
    trend: list[dict], dept_data: list[dict], inv_summary: dict,
    targets: list[dict], salary_data: list[dict], payroll: float,
    revenue: float, velocity_data: list[dict], attrition_data: list[dict],
    cap: int = 6,
) -> list[dict]:
    out = []
    for fn, args in [
        (rule_revenue_change,    (trend,)),
        (rule_revenue_streak,    (trend,)),
        (rule_top_department,    (dept_data,)),
        (rule_low_stock,         (inv_summary,)),
        (rule_high_salary_dept,  (salary_data,)),
        (rule_payroll_vs_revenue,(payroll, revenue)),
        (rule_overstock_stockout,(velocity_data,)),
        (rule_attrition,         (attrition_data,)),
    ]:
        r = fn(*args)
        if r:
            out.append(r)
    out.extend(rule_manager_performance(targets))
    return _sort_cap(out, cap)


def generate_sales_insights(trend, dept_data, targets, cap=5):
    out = []
    for fn, args in [
        (rule_revenue_change,  (trend,)),
        (rule_revenue_streak,  (trend,)),
        (rule_aov_change,      (trend,)),
        (rule_top_department,  (dept_data,)),
    ]:
        r = fn(*args)
        if r:
            out.append(r)
    out.extend(rule_manager_performance(targets))
    return _sort_cap(out, cap)


def generate_inventory_insights(inv_summary, velocity_data, cap=5):
    out = []
    for fn, args in [
        (rule_low_stock,         (inv_summary,)),
        (rule_overstock_stockout,(velocity_data,)),
        (rule_dead_stock,        (velocity_data,)),
    ]:
        r = fn(*args)
        if r:
            out.append(r)
    return _sort_cap(out, cap)


def generate_workforce_insights(wf_summary, salary_data, attrition_data, cap=5):
    out = []
    for fn, args in [
        (rule_headcount_growth, (wf_summary,)),
        (rule_high_salary_dept, (salary_data,)),
        (rule_attrition,        (attrition_data, 15.0)),
    ]:
        r = fn(*args)
        if r:
            out.append(r)
    return _sort_cap(out, cap)


def generate_finance_insights(fin_summary, payroll, revenue, cap=5):
    out = []
    for fn, args in [
        (rule_profit_margin,      (fin_summary,)),
        (rule_net_profit,         (fin_summary,)),
        (rule_payroll_vs_revenue, (payroll, revenue)),
    ]:
        r = fn(*args)
        if r:
            out.append(r)
    return _sort_cap(out, cap)


def generate_hr_insights(hr_summary, attrition_data, cap=5):
    out = []
    for fn, args in [
        (rule_hires_vs_exits, (hr_summary,)),
        (rule_attrition,      (attrition_data, 15.0)),
    ]:
        r = fn(*args)
        if r:
            out.append(r)
    return _sort_cap(out, cap)
