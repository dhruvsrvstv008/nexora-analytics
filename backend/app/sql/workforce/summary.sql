-- Business question: What is the current state of our workforce?
WITH headcount AS (
    SELECT
        COUNT(*) FILTER (WHERE status = 'active')                      AS active_count,
        COUNT(*) FILTER (WHERE status IN ('resigned','terminated'))     AS exited_count,
        COUNT(*) FILTER (WHERE status = 'active' AND hire_date >= date_trunc('year', CURRENT_DATE)) AS new_hires_ytd,
        COUNT(*) FILTER (WHERE status IN ('resigned','terminated')
                           AND exit_date >= date_trunc('year', CURRENT_DATE)) AS exits_ytd,
        ROUND(AVG(EXTRACT(YEAR FROM age(COALESCE(exit_date, CURRENT_DATE), hire_date))
              * 12 + EXTRACT(MONTH FROM age(COALESCE(exit_date, CURRENT_DATE), hire_date)))::NUMERIC, 1)
                                                                       AS avg_tenure_months
    FROM employees
    WHERE (CAST(:department_id AS INTEGER) IS NULL OR department_id = CAST(:department_id AS INTEGER))
),
prev_year AS (
    SELECT COUNT(*) AS headcount_prev_year
    FROM employees
    WHERE status = 'active'
      AND hire_date < date_trunc('year', CURRENT_DATE)
      AND (exit_date IS NULL OR exit_date >= date_trunc('year', CURRENT_DATE))
)
SELECT
    h.active_count,
    h.exited_count,
    h.new_hires_ytd,
    h.exits_ytd,
    h.avg_tenure_months,
    p.headcount_prev_year,
    ROUND(h.exits_ytd::NUMERIC / NULLIF(h.active_count + h.exits_ytd, 0) * 100, 2) AS attrition_rate_pct
FROM headcount h, prev_year p
