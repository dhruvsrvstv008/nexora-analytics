-- Business question: Which product categories drive revenue?
SELECT
    c.category_id,
    c.name                                                              AS category_name,
    COUNT(DISTINCT p.product_id)                                       AS product_count,
    SUM(si.quantity)                                                    AS units_sold,
    ROUND(SUM(si.line_total)::NUMERIC, 2)                             AS revenue,
    ROUND(SUM((si.unit_price - si.unit_cost) * si.quantity)::NUMERIC, 2) AS profit,
    ROUND(
        SUM(si.line_total) / NULLIF(SUM(SUM(si.line_total)) OVER (), 0) * 100,
        2
    )                                                                  AS revenue_share_pct,
    RANK() OVER (ORDER BY SUM(si.line_total) DESC)                    AS revenue_rank
FROM sale_items si
JOIN sales      s  ON s.sale_id     = si.sale_id
JOIN products   p  ON p.product_id  = si.product_id
JOIN categories c  ON c.category_id = p.category_id
JOIN employees  e  ON e.employee_id = s.employee_id
WHERE s.status = 'completed'
  AND (CAST(:year AS INTEGER)          IS NULL OR EXTRACT(YEAR  FROM s.order_date) = CAST(:year AS INTEGER))
  AND (CAST(:month AS INTEGER)         IS NULL OR EXTRACT(MONTH FROM s.order_date) = CAST(:month AS INTEGER))
  AND (CAST(:department_id AS INTEGER) IS NULL OR e.department_id = CAST(:department_id AS INTEGER))
GROUP BY c.category_id, c.name
ORDER BY revenue DESC
