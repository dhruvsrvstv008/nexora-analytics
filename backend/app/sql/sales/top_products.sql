-- Business question: What are the top 10 products by revenue?
-- Shows RANK() vs DENSE_RANK() to illustrate the difference when ties occur:
-- RANK skips numbers after ties (1,2,2,4); DENSE_RANK never skips (1,2,2,3).
SELECT
    p.product_id,
    p.sku,
    p.name                                                              AS product_name,
    c.name                                                              AS category_name,
    SUM(si.quantity)                                                    AS units_sold,
    ROUND(SUM(si.line_total)::NUMERIC, 2)                             AS revenue,
    ROUND(SUM((si.unit_price - si.unit_cost) * si.quantity)::NUMERIC, 2) AS profit,
    RANK()       OVER (ORDER BY SUM(si.line_total) DESC)              AS rank,
    DENSE_RANK() OVER (ORDER BY SUM(si.line_total) DESC)              AS dense_rank
FROM sale_items si
JOIN sales      s ON s.sale_id    = si.sale_id AND s.status = 'completed'
JOIN products   p ON p.product_id = si.product_id
JOIN categories c ON c.category_id = p.category_id
WHERE (CAST(:year AS INTEGER) IS NULL OR EXTRACT(YEAR FROM s.order_date) = CAST(:year AS INTEGER))
GROUP BY p.product_id, p.sku, p.name, c.name
ORDER BY revenue DESC
LIMIT 10
