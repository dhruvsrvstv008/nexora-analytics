-- Business question: Who is exceeding, meeting, or missing their targets?
-- Uses CASE to classify performance tiers and RANK() within each period.
WITH emp_actual AS (
    -- Actual revenue per employee per month (completed orders only)
    SELECT
        s.employee_id,
        date_trunc('month', s.order_date)::date AS period_month,
        ROUND(SUM(s.total_amount)::NUMERIC, 2)  AS actual_revenue,
        COUNT(DISTINCT s.sale_id)               AS order_count
    FROM sales s
    WHERE s.status = 'completed'
      AND (CAST(:year AS INTEGER)          IS NULL OR EXTRACT(YEAR  FROM s.order_date) = CAST(:year AS INTEGER))
      AND (CAST(:month AS INTEGER)         IS NULL OR EXTRACT(MONTH FROM s.order_date) = CAST(:month AS INTEGER))
    GROUP BY s.employee_id, 2
)
SELECT
    e.employee_id,
    e.full_name,
    d.name                                                              AS department_name,
    mgr.full_name                                                       AS manager_name,
    t.period_month,
    COALESCE(a.actual_revenue, 0)                                      AS actual_revenue,
    t.target_amount,
    COALESCE(a.order_count, 0)                                         AS order_count,
    ROUND(COALESCE(a.actual_revenue, 0) / NULLIF(t.target_amount, 0) * 100, 2) AS achievement_pct,
    -- CASE bucketing: Exceeded = 110%+, Met = 100-110%, Missed = <100%
    CASE
        WHEN COALESCE(a.actual_revenue, 0) >= t.target_amount * 1.10  THEN 'Exceeded'
        WHEN COALESCE(a.actual_revenue, 0) >= t.target_amount          THEN 'Met'
        ELSE                                                                 'Missed'
    END                                                                AS performance_tier,
    -- Rank within each month so the front-end can show leaderboard ordering
    RANK() OVER (
        PARTITION BY t.period_month
        ORDER BY COALESCE(a.actual_revenue, 0) DESC
    )                                                                  AS rank_in_period
FROM targets t
JOIN employees   e   ON e.employee_id   = t.employee_id
JOIN departments d   ON d.department_id = e.department_id
LEFT JOIN employees mgr ON mgr.employee_id = e.manager_id
LEFT JOIN emp_actual  a ON a.employee_id   = t.employee_id
                        AND a.period_month  = t.period_month
WHERE t.employee_id IS NOT NULL
  AND (CAST(:department_id AS INTEGER) IS NULL OR e.department_id = CAST(:department_id AS INTEGER))
  AND (CAST(:manager_id AS INTEGER)    IS NULL OR e.manager_id    = CAST(:manager_id AS INTEGER))
ORDER BY t.period_month DESC, achievement_pct DESC
