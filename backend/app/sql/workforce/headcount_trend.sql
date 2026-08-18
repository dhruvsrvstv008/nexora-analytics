-- Business question: How has headcount grown month over month?
-- Counts employees who were active at the end of each month
-- (hired before or during the month AND not yet exited).
WITH month_series AS (
    SELECT generate_series(
        date_trunc('month', (SELECT MIN(hire_date) FROM employees))::date,
        date_trunc('month', CURRENT_DATE)::date,
        '1 month'::interval
    )::date AS period
),
new_hires AS (
    SELECT
        date_trunc('month', hire_date)::date AS period,
        COUNT(*)                             AS new_hire_count
    FROM employees
    WHERE (CAST(:department_id AS INTEGER) IS NULL OR department_id = CAST(:department_id AS INTEGER))
    GROUP BY 1
),
exits AS (
    SELECT
        date_trunc('month', exit_date)::date AS period,
        COUNT(*)                             AS exit_count
    FROM employees
    WHERE exit_date IS NOT NULL
      AND (CAST(:department_id AS INTEGER) IS NULL OR department_id = CAST(:department_id AS INTEGER))
    GROUP BY 1
)
SELECT
    ms.period,
    COALESCE(nh.new_hire_count, 0)  AS new_hires,
    COALESCE(ex.exit_count, 0)      AS exits,
    -- Active headcount as of end of each month
    COUNT(e.employee_id)            AS active_headcount
FROM month_series ms
LEFT JOIN new_hires nh ON nh.period = ms.period
LEFT JOIN exits     ex ON ex.period = ms.period
LEFT JOIN employees e  ON date_trunc('month', e.hire_date)::date <= ms.period
                      AND (e.exit_date IS NULL OR date_trunc('month', e.exit_date)::date > ms.period)
                      AND (CAST(:department_id AS INTEGER) IS NULL OR e.department_id = CAST(:department_id AS INTEGER))
GROUP BY ms.period, nh.new_hire_count, ex.exit_count
ORDER BY ms.period
