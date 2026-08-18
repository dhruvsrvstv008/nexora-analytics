-- Business question: Where is attrition happening and at what rate per department?
SELECT
    d.department_id,
    d.name                                                             AS department_name,
    COUNT(e.employee_id) FILTER (WHERE e.status = 'active')           AS active_headcount,
    COUNT(e.employee_id) FILTER (WHERE e.status IN ('resigned','terminated'))     AS exit_count,
    COUNT(e.employee_id) FILTER (WHERE e.status = 'resigned')         AS resigned_count,
    COUNT(e.employee_id) FILTER (WHERE e.status = 'terminated')       AS terminated_count,
    ROUND(
        COUNT(e.employee_id) FILTER (WHERE e.status IN ('resigned','terminated'))::NUMERIC
        / NULLIF(COUNT(e.employee_id), 0) * 100,
        2
    )                                                                  AS attrition_rate_pct,
    ROUND(
        AVG(
            CASE WHEN e.exit_date IS NOT NULL THEN
                EXTRACT(YEAR  FROM age(e.exit_date, e.hire_date)) * 12
              + EXTRACT(MONTH FROM age(e.exit_date, e.hire_date))
            END
        )::NUMERIC,
        1
    )                                                                  AS avg_tenure_at_exit_months
FROM employees   e
JOIN departments d ON d.department_id = e.department_id
GROUP BY d.department_id, d.name
ORDER BY attrition_rate_pct DESC
