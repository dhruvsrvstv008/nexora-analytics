-- Business question: Which 3 products lead each category?
-- ROW_NUMBER() OVER (PARTITION BY category) resets the counter per category,
-- so we get an independent top-3 for every category in one query.
WITH ranked AS (
    SELECT
        c.category_id,
        c.name                                                          AS category_name,
        p.product_id,
        p.sku,
        p.name                                                          AS product_name,
        SUM(si.quantity)                                                AS units_sold,
        ROUND(SUM(si.line_total)::NUMERIC, 2)                         AS revenue,
        ROUND(SUM((si.unit_price - si.unit_cost) * si.quantity)::NUMERIC, 2) AS profit,
        ROW_NUMBER() OVER (
            PARTITION BY c.category_id
            ORDER BY SUM(si.line_total) DESC
        )                                                               AS rank_in_category
    FROM sale_items si
    JOIN sales      s ON s.sale_id    = si.sale_id AND s.status = 'completed'
    JOIN products   p ON p.product_id = si.product_id
    JOIN categories c ON c.category_id = p.category_id
    WHERE (CAST(:year AS INTEGER) IS NULL OR EXTRACT(YEAR FROM s.order_date) = CAST(:year AS INTEGER))
    GROUP BY c.category_id, c.name, p.product_id, p.sku, p.name
)
SELECT *
FROM   ranked
WHERE  rank_in_category <= 3
ORDER BY category_id, rank_in_category
