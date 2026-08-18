-- Business question: How many people did we hire each month?
SELECT
    date_trunc('month', hire_date)::date                               AS period,
    COUNT(*)                                                           AS new_hires,
    COUNT(*) FILTER (WHERE job_level = 'manager')                     AS new_managers,
    COUNT(*) FILTER (WHERE job_level = 'senior')                      AS new_seniors,
    COUNT(*) FILTER (WHERE job_level = 'associate')                   AS new_associates,
    -- Running cumulative headcount: counts all employees hired up to and including this month
    -- who have not yet exited.
    SUM(COUNT(*)) OVER (ORDER BY date_trunc('month', hire_date) ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_hires
FROM employees
WHERE (CAST(:department_id AS INTEGER) IS NULL OR department_id = CAST(:department_id AS INTEGER))
GROUP BY 1
ORDER BY 1
