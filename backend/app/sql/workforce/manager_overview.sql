-- Business question: What are a specific manager's team KPIs?
SELECT
    mgr.employee_id                                                    AS manager_id,
    mgr.full_name                                                      AS manager_name,
    mgr.job_title,
    d.name                                                             AS department_name,
    COUNT(DISTINCT e.employee_id)                                      AS team_size,
    ROUND(AVG(e.salary)::NUMERIC, 2)                                  AS team_avg_salary,
    ROUND(SUM(e.salary)::NUMERIC, 2)                                  AS team_payroll,
    COALESCE(SUM(s.total_amount), 0)                                   AS team_revenue,
    COALESCE(SUM(t.target_amount), 0)                                  AS team_target,
    ROUND(
        COALESCE(SUM(s.total_amount), 0)
        / NULLIF(COALESCE(SUM(t.target_amount), 0), 0) * 100,
        2
    )                                                                  AS team_achievement_pct
FROM employees mgr
JOIN employees   e  ON e.manager_id    = mgr.employee_id AND e.status = 'active'
JOIN departments d  ON d.department_id = mgr.department_id
LEFT JOIN sales  s  ON s.employee_id = e.employee_id AND s.status = 'completed'
                    AND (CAST(:year AS INTEGER) IS NULL OR EXTRACT(YEAR FROM s.order_date) = CAST(:year AS INTEGER))
LEFT JOIN targets t ON t.employee_id = e.employee_id
                    AND (CAST(:year AS INTEGER) IS NULL OR EXTRACT(YEAR FROM t.period_month) = CAST(:year AS INTEGER))
WHERE mgr.employee_id = CAST(:manager_id AS INTEGER)
GROUP BY mgr.employee_id, mgr.full_name, mgr.job_title, d.name
