-- Business question: How is headcount distributed across departments, levels, or managers?
-- The :group_by parameter selects the dimension (department | level | manager | zone).
SELECT
    CASE CAST(:group_by AS TEXT)
        WHEN 'department' THEN d.name
        WHEN 'level'      THEN e.job_level
        WHEN 'manager'    THEN COALESCE(mgr.full_name, 'No Manager')
        ELSE d.name
    END                                                                AS dimension_label,
    CASE CAST(:group_by AS TEXT)
        WHEN 'department' THEN CAST(d.department_id AS TEXT)
        WHEN 'level'      THEN e.job_level
        WHEN 'manager'    THEN CAST(e.manager_id AS TEXT)
        ELSE CAST(d.department_id AS TEXT)
    END                                                                AS dimension_key,
    COUNT(*)                                                           AS headcount,
    ROUND(AVG(e.salary)::NUMERIC, 2)                                  AS avg_salary,
    MIN(e.hire_date)                                                   AS earliest_hire,
    ROUND(
        COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100,
        2
    )                                                                  AS headcount_share_pct
FROM employees e
JOIN departments d   ON d.department_id = e.department_id
LEFT JOIN employees mgr ON mgr.employee_id = e.manager_id
WHERE e.status = 'active'
  AND (CAST(:department_id AS INTEGER) IS NULL OR e.department_id = CAST(:department_id AS INTEGER))
GROUP BY 1, 2
ORDER BY headcount DESC
