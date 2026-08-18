-- Business question: How do salary levels compare across departments?
SELECT
    d.department_id,
    d.name                                                             AS department_name,
    COUNT(e.employee_id)                                               AS headcount,
    ROUND(AVG(e.salary)::NUMERIC, 2)                                  AS avg_salary,
    ROUND(MIN(e.salary)::NUMERIC, 2)                                  AS min_salary,
    ROUND(MAX(e.salary)::NUMERIC, 2)                                  AS max_salary,
    ROUND(SUM(e.salary)::NUMERIC, 2)                                  AS monthly_payroll,
    -- Payroll share: window function over all departments
    ROUND(SUM(e.salary) / SUM(SUM(e.salary)) OVER () * 100, 2)       AS payroll_share_pct,
    -- Rank the department by average salary
    RANK() OVER (ORDER BY AVG(e.salary) DESC)                         AS salary_rank
FROM employees   e
JOIN departments d ON d.department_id = e.department_id
WHERE e.status = 'active'
GROUP BY d.department_id, d.name
ORDER BY avg_salary DESC
