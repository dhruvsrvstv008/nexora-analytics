from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.services import workforce_service, finance_service
from app.insights.rules import generate_salary_insights

router = APIRouter()


def _check_salary_access(current_user):
    """Salary individual records are admin-only. Aggregates allow analyst."""
    pass  # enforced per-endpoint via require_role


@router.get("/summary", summary="Avg salary, total payroll, median")
def summary(
    department_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "analyst")),
):
    return workforce_service.get_salary_summary(db, department_id=department_id)


@router.get("/by-department", summary="Avg salary and payroll share per department")
def by_department(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "analyst")),
):
    return workforce_service.get_salary_by_department(db)


@router.get("/above-department-average", summary="Employees earning above their dept average (CTE + correlated versions)")
def above_department_average(
    department_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),  # individual salary data — admin only
):
    # CTE version is the default; correlated version kept in docs/SQL_SHOWCASE.md for comparison
    return workforce_service.get_above_dept_avg(db, department_id=department_id, use_cte=True)


@router.get("/top-earners", summary="Top 10 earners across the company")
def top_earners(
    department_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),  # individual salary — admin only
):
    return workforce_service.get_top_earners(db, department_id=department_id)


@router.get("/bands", summary="Salary quartile distribution via NTILE(4)")
def bands(
    department_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "analyst")),
):
    rows = workforce_service.get_percentile_bands(db, department_id=department_id)
    # Analysts see distributions but not individual names / salaries
    if current_user.role == "analyst":
        return [{"salary_quartile": r["salary_quartile"], "quartile_label": r["quartile_label"],
                 "department_name": r["department_name"], "job_level": r["job_level"]}
                for r in rows]
    return rows


@router.get("/payroll-share", summary="Payroll as % of total per department (window function)")
def payroll_share(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "analyst")),
):
    return workforce_service.get_payroll_share(db)


@router.get("/department-rank", summary="Salary rank within each department (RANK PARTITION BY)")
def department_rank(
    department_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    return workforce_service.get_salary_department_rank(db, department_id=department_id)


@router.get("/insights", summary="Rule-based salary insights")
def insights(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "analyst")),
):
    """Deterministic rule-based insights for the salary domain — no AI/LLM."""
    salary_data = workforce_service.get_salary_by_department(db)
    fin_sum     = finance_service.get_summary(db)
    # Use actual payroll (sum of department payrolls) vs gross revenue for the ratio
    payroll = sum(float(r.get("monthly_payroll") or 0) for r in salary_data)
    revenue = float(fin_sum.get("revenue") or 0)
    return generate_salary_insights(salary_data=salary_data, payroll=payroll, revenue=revenue)
