-- Business question: Who are the highest earners within each department?
-- RANK() OVER (PARTITION BY department_id) resets the rank counter per dept,
-- giving an independent salary leaderboard for every department.
SELECT
    e.employee_id,
    e.full_name,
    d.name                                                             AS department_name,
    e.job_title,
    e.job_level,
    e.salary,
    RANK() OVER (
        PARTITION BY e.department_id
        ORDER BY e.salary DESC
    )                                                                  AS dept_salary_rank,
    ROUND(AVG(e.salary) OVER (PARTITION BY e.department_id)::NUMERIC, 2) AS dept_avg_salary,
    ROUND((e.salary - AVG(e.salary) OVER (PARTITION BY e.department_id))::NUMERIC, 2) AS vs_dept_avg
FROM employees   e
JOIN departments d ON d.department_id = e.department_id
WHERE e.status = 'active'
  AND (CAST(:department_id AS INTEGER) IS NULL OR e.department_id = CAST(:department_id AS INTEGER))
ORDER BY e.department_id, dept_salary_rank
