-- Business question: Who are the top 10 earners across the company?
SELECT
    e.employee_id,
    e.full_name,
    d.name           AS department_name,
    e.job_title,
    e.job_level,
    e.salary,
    e.hire_date,
    RANK() OVER (ORDER BY e.salary DESC) AS salary_rank
FROM employees   e
JOIN departments d ON d.department_id = e.department_id
WHERE e.status = 'active'
  AND (CAST(:department_id AS INTEGER) IS NULL OR e.department_id = CAST(:department_id AS INTEGER))
ORDER BY e.salary DESC
LIMIT 10
