-- Business question: Which employees earn more than their department's average?
-- CTE version: computes dept averages once in the CTE, then joins — O(1) aggregate
-- per department vs O(n) correlated lookups.  Prefer this in production.
-- Both versions are kept in docs/SQL_SHOWCASE.md for the interview comparison.
WITH dept_averages AS (
    SELECT
        department_id,
        ROUND(AVG(salary)::NUMERIC, 2) AS avg_salary
    FROM employees
    WHERE status = 'active'
    GROUP BY department_id
)
SELECT
    e.employee_id,
    e.full_name,
    d.name                             AS department_name,
    e.job_title,
    e.job_level,
    e.salary,
    da.avg_salary                      AS dept_avg_salary,
    ROUND((e.salary - da.avg_salary)::NUMERIC, 2) AS salary_premium
FROM employees    e
JOIN departments  d  ON d.department_id  = e.department_id
JOIN dept_averages da ON da.department_id = e.department_id
WHERE e.status  = 'active'
  AND e.salary  > da.avg_salary
  AND (CAST(:department_id AS INTEGER) IS NULL OR e.department_id = CAST(:department_id AS INTEGER))
ORDER BY salary_premium DESC
