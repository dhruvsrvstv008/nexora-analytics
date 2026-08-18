-- Business question: What are the top-line salary and payroll KPIs?
SELECT
    COUNT(*)                                                           AS active_employees,
    ROUND(AVG(salary)::NUMERIC, 2)                                    AS avg_salary,
    ROUND(MIN(salary)::NUMERIC, 2)                                    AS min_salary,
    ROUND(MAX(salary)::NUMERIC, 2)                                    AS max_salary,
    ROUND(SUM(salary)::NUMERIC, 2)                                    AS total_monthly_payroll,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary)::NUMERIC, 2) AS median_salary
FROM employees
WHERE status = 'active'
  AND (CAST(:department_id AS INTEGER) IS NULL OR department_id = CAST(:department_id AS INTEGER))
