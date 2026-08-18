-- Business question: What share of total payroll does each department consume?
-- SUM(payroll) OVER () is a window function with no PARTITION — it sums across all rows,
-- letting us compute each department's share without a separate subquery.
SELECT
    d.department_id,
    d.name                                                             AS department_name,
    COUNT(e.employee_id)                                               AS headcount,
    ROUND(SUM(e.salary)::NUMERIC, 2)                                  AS monthly_payroll,
    ROUND(
        SUM(e.salary) / SUM(SUM(e.salary)) OVER () * 100,
        2
    )                                                                  AS payroll_share_pct,
    RANK() OVER (ORDER BY SUM(e.salary) DESC)                         AS payroll_rank
FROM employees   e
JOIN departments d ON d.department_id = e.department_id
WHERE e.status = 'active'
GROUP BY d.department_id, d.name
ORDER BY monthly_payroll DESC
