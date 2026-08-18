-- Business question: Which employees earn more than their department's average?
-- CORRELATED SUBQUERY version: for every outer row, the subquery re-runs
-- against the same department_id.  Readable but O(n) subquery executions —
-- compare with the CTE version in above_dept_avg_cte.sql.
SELECT
    e.employee_id,
    e.full_name,
    d.name                                                             AS department_name,
    e.job_title,
    e.job_level,
    e.salary,
    ROUND(
        (SELECT AVG(e2.salary)
         FROM   employees e2
         WHERE  e2.department_id = e.department_id
           AND  e2.status        = 'active'),
        2
    )                                                                  AS dept_avg_salary,
    ROUND(
        e.salary - (SELECT AVG(e2.salary)
                    FROM   employees e2
                    WHERE  e2.department_id = e.department_id
                      AND  e2.status        = 'active'),
        2
    )                                                                  AS salary_premium
FROM employees   e
JOIN departments d ON d.department_id = e.department_id
WHERE e.status = 'active'
  AND e.salary > (
          SELECT AVG(e2.salary)
          FROM   employees e2
          WHERE  e2.department_id = e.department_id
            AND  e2.status        = 'active'
      )
  AND (CAST(:department_id AS INTEGER) IS NULL OR e.department_id = CAST(:department_id AS INTEGER))
ORDER BY salary_premium DESC
