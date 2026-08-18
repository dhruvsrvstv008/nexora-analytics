-- Business question: Which products need immediate attention (out, low, overstock)?
-- Single query returns all alert types; the service layer splits by alert_type.
SELECT
    p.product_id,
    p.sku,
    p.name                                                             AS product_name,
    c.name                                                             AS category_name,
    i.quantity_on_hand,
    p.reorder_level,
    ROUND((i.quantity_on_hand * p.unit_cost)::NUMERIC, 2)             AS stock_value,
    i.last_restocked_at,
    i.warehouse_location,
    -- CASE classifies the alert; overstock threshold = 10× reorder level
    CASE
        WHEN i.quantity_on_hand = 0                        THEN 'out_of_stock'
        WHEN i.quantity_on_hand < p.reorder_level          THEN 'low_stock'
        WHEN i.quantity_on_hand > p.reorder_level * 10     THEN 'overstock'
    END                                                                AS alert_type,
    -- How many units short of reorder level (positive = deficit)
    GREATEST(0, p.reorder_level - i.quantity_on_hand)                 AS units_short,
    -- Surplus above overstock threshold (positive = excess)
    GREATEST(0, i.quantity_on_hand - p.reorder_level * 10)           AS units_excess
FROM products   p
JOIN categories c ON c.category_id = p.category_id
JOIN inventory  i ON i.product_id  = p.product_id
WHERE p.is_active = TRUE
  AND (
    i.quantity_on_hand = 0
    OR i.quantity_on_hand < p.reorder_level
    OR i.quantity_on_hand > p.reorder_level * 10
  )
  AND (CAST(:category_id AS INTEGER) IS NULL OR p.category_id = CAST(:category_id AS INTEGER))
  AND (CAST(:alert_type AS TEXT)     IS NULL OR
       CASE
           WHEN i.quantity_on_hand = 0                    THEN 'out_of_stock'
           WHEN i.quantity_on_hand < p.reorder_level      THEN 'low_stock'
           WHEN i.quantity_on_hand > p.reorder_level * 10 THEN 'overstock'
       END = CAST(:alert_type AS TEXT))
ORDER BY
    CASE WHEN i.quantity_on_hand = 0 THEN 1
         WHEN i.quantity_on_hand < p.reorder_level THEN 2
         ELSE 3 END,
    stock_value DESC
