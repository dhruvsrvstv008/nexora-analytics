-- Business question: Which products generate the most revenue?
-- Uses RANK() and DENSE_RANK() to show both rank and tied-rank positions.
SELECT
    p.product_id,
    p.sku,
    p.name                                                              AS product_name,
    c.name                                                              AS category_name,
    SUM(si.quantity)                                                    AS units_sold,
    ROUND(SUM(si.line_total)::NUMERIC, 2)                             AS revenue,
    ROUND(SUM((si.unit_price - si.unit_cost) * si.quantity)::NUMERIC, 2) AS profit,
    ROUND(SUM((si.unit_price - si.unit_cost) * si.quantity)
          / NULLIF(SUM(si.line_total), 0) * 100, 2)                   AS margin_pct,
    -- RANK allows gaps on ties; DENSE_RANK does not
    RANK()       OVER (ORDER BY SUM(si.line_total) DESC)              AS revenue_rank,
    DENSE_RANK() OVER (ORDER BY SUM(si.line_total) DESC)              AS revenue_dense_rank
FROM sale_items si
JOIN sales    s ON s.sale_id    = si.sale_id
JOIN products p ON p.product_id = si.product_id
JOIN categories c ON c.category_id = p.category_id
JOIN employees e ON e.employee_id  = s.employee_id
WHERE s.status = 'completed'
  AND (CAST(:year AS INTEGER)          IS NULL OR EXTRACT(YEAR  FROM s.order_date) = CAST(:year AS INTEGER))
  AND (CAST(:month AS INTEGER)         IS NULL OR EXTRACT(MONTH FROM s.order_date) = CAST(:month AS INTEGER))
  AND (CAST(:category_id AS INTEGER)   IS NULL OR p.category_id   = CAST(:category_id AS INTEGER))
  AND (CAST(:department_id AS INTEGER) IS NULL OR e.department_id = CAST(:department_id AS INTEGER))
GROUP BY p.product_id, p.sku, p.name, c.name
ORDER BY revenue DESC
LIMIT 100
