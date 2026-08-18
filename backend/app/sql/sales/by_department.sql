-- Business question: Which departments drive the most revenue and profit?
SELECT
    d.department_id,
    d.name                                                              AS department_name,
    COUNT(DISTINCT s.sale_id)                                          AS total_orders,
    ROUND(SUM(s.total_amount)::NUMERIC, 2)                            AS revenue,
    ROUND(SUM((si.unit_price - si.unit_cost) * si.quantity)::NUMERIC, 2) AS profit,
    ROUND(SUM(s.total_amount)::NUMERIC / NULLIF(COUNT(DISTINCT s.sale_id), 0), 2) AS avg_order_value,
    -- Profit margin per department
    ROUND(
        SUM((si.unit_price - si.unit_cost) * si.quantity)
        / NULLIF(SUM(s.total_amount), 0) * 100,
        2
    )                                                                  AS profit_margin_pct,
    -- Revenue share: this department's revenue as % of total in the same period
    ROUND(
        SUM(s.total_amount) / SUM(SUM(s.total_amount)) OVER () * 100,
        2
    )                                                                  AS revenue_share_pct
FROM sales s
JOIN sale_items si ON si.sale_id    = s.sale_id
JOIN employees  e  ON e.employee_id = s.employee_id
JOIN departments d ON d.department_id = e.department_id
WHERE s.status = 'completed'
  AND (CAST(:year AS INTEGER)  IS NULL OR EXTRACT(YEAR  FROM s.order_date) = CAST(:year AS INTEGER))
  AND (CAST(:month AS INTEGER) IS NULL OR EXTRACT(MONTH FROM s.order_date) = CAST(:month AS INTEGER))
  AND (CAST(:region_id AS INTEGER) IS NULL OR s.region_id = CAST(:region_id AS INTEGER))
GROUP BY d.department_id, d.name
ORDER BY revenue DESC
