-- Business question: What is the stock value and composition per category?
SELECT
    c.category_id,
    c.name                                                             AS category_name,
    COUNT(p.product_id)                                                AS product_count,
    SUM(i.quantity_on_hand)                                            AS total_units,
    ROUND(SUM(i.quantity_on_hand * p.unit_cost)::NUMERIC, 2)          AS stock_value,
    ROUND(
        SUM(i.quantity_on_hand * p.unit_cost)
        / NULLIF(SUM(SUM(i.quantity_on_hand * p.unit_cost)) OVER (), 0) * 100,
        2
    )                                                                  AS value_share_pct,
    COUNT(p.product_id) FILTER (WHERE i.quantity_on_hand = 0)         AS out_of_stock,
    COUNT(p.product_id) FILTER (WHERE i.quantity_on_hand < p.reorder_level AND i.quantity_on_hand > 0) AS low_stock,
    RANK() OVER (ORDER BY SUM(i.quantity_on_hand * p.unit_cost) DESC) AS value_rank
FROM products   p
JOIN categories c ON c.category_id = p.category_id
JOIN inventory  i ON i.product_id  = p.product_id
WHERE p.is_active = TRUE
GROUP BY c.category_id, c.name
ORDER BY stock_value DESC
