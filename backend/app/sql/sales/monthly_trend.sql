-- Business question: How is revenue and profit trending month-over-month?
-- Uses LAG() to compute MoM growth and SUM() OVER to accumulate revenue.
WITH monthly AS (
    SELECT
        date_trunc('month', s.order_date)::date                         AS period,
        COUNT(DISTINCT s.sale_id)                                       AS order_count,
        ROUND(SUM(s.total_amount)::NUMERIC, 2)                         AS revenue,
        ROUND(SUM((si.unit_price - si.unit_cost) * si.quantity)::NUMERIC, 2) AS profit
    FROM sales s
    JOIN sale_items si ON si.sale_id    = s.sale_id
    JOIN employees  e  ON e.employee_id = s.employee_id
    WHERE s.status = 'completed'
      AND (CAST(:year AS INTEGER)          IS NULL OR EXTRACT(YEAR FROM s.order_date) = CAST(:year AS INTEGER))
      AND (CAST(:department_id AS INTEGER) IS NULL OR e.department_id = CAST(:department_id AS INTEGER))
      AND (CAST(:region_id AS INTEGER)     IS NULL OR s.region_id     = CAST(:region_id AS INTEGER))
    GROUP BY 1
)
SELECT
    period,
    order_count,
    revenue,
    profit,
    -- MoM growth: LAG fetches the previous month's value within the ordered window
    LAG(revenue) OVER (ORDER BY period)  AS prev_revenue,
    ROUND(
        (revenue - LAG(revenue) OVER (ORDER BY period))
        / NULLIF(LAG(revenue) OVER (ORDER BY period), 0) * 100,
        2
    )                                    AS revenue_growth_pct,
    ROUND(
        (profit - LAG(profit) OVER (ORDER BY period))
        / NULLIF(LAG(profit) OVER (ORDER BY period), 0) * 100,
        2
    )                                    AS profit_growth_pct,
    -- Cumulative revenue: running total from the first month to the current row
    SUM(revenue) OVER (ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_revenue
FROM monthly
ORDER BY period
