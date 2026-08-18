-- Business question: What are the HR top-line metrics?
WITH hc AS (
    SELECT
        COUNT(*) FILTER (WHERE status = 'active')                     AS active_count,
        COUNT(*) FILTER (WHERE status != 'active')                    AS exited_count,
        COUNT(*) FILTER (WHERE status = 'active'
          AND hire_date >= date_trunc('year', CURRENT_DATE))           AS new_hires_ytd,
        COUNT(*) FILTER (WHERE exit_date >= date_trunc('year', CURRENT_DATE)
          AND exit_date IS NOT NULL)                                   AS exits_ytd
    FROM employees
)
SELECT
    hc.active_count,
    hc.exited_count,
    hc.new_hires_ytd,
    hc.exits_ytd,
    ROUND(hc.exits_ytd::NUMERIC / NULLIF(hc.active_count + hc.exits_ytd, 0) * 100, 2) AS attrition_rate_pct,
    ROUND(
        (SELECT AVG(
            EXTRACT(YEAR  FROM age(COALESCE(exit_date, CURRENT_DATE), hire_date)) * 12
          + EXTRACT(MONTH FROM age(COALESCE(exit_date, CURRENT_DATE), hire_date))
        ) FROM employees WHERE status = 'active')::NUMERIC,
        1
    )                                                                  AS avg_tenure_months
FROM hc
