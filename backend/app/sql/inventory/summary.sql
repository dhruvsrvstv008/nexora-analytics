-- Business question: What is the current state of inventory across the warehouse?
SELECT
    COUNT(DISTINCT p.product_id)                                       AS total_products,
    COUNT(DISTINCT p.product_id) FILTER (WHERE i.quantity_on_hand = 0)  AS out_of_stock_count,
    COUNT(DISTINCT p.product_id) FILTER (
        WHERE i.quantity_on_hand > 0 AND i.quantity_on_hand < p.reorder_level
    )                                                                  AS low_stock_count,
    COUNT(DISTINCT p.product_id) FILTER (
        WHERE i.quantity_on_hand > p.reorder_level * 10
    )                                                                  AS overstock_count,
    ROUND(SUM(i.quantity_on_hand * p.unit_cost)::NUMERIC, 2)          AS total_stock_value,
    ROUND(AVG(i.quantity_on_hand)::NUMERIC, 1)                        AS avg_units_on_hand,
    SUM(i.quantity_on_hand)                                            AS total_units_on_hand
FROM products  p
JOIN inventory i ON i.product_id = p.product_id
WHERE p.is_active = TRUE
  AND (CAST(:category_id AS INTEGER) IS NULL OR p.category_id = CAST(:category_id AS INTEGER))
