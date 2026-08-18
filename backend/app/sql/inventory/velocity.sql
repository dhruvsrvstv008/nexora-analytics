-- Business question: Which products sell quickly vs slowly, and how many months of cover remain?
-- Turnover ratio = outbound units ÷ avg stock; NTILE(4) classifies velocity.
-- Months-of-cover flags both overstock (too much) and stockout risk (too little).
WITH outbound_30d AS (
    -- Average monthly outbound units per product (last 6 months)
    SELECT
        product_id,
        ROUND(SUM(quantity)::NUMERIC / 6, 2) AS avg_monthly_outbound
    FROM stock_movements
    WHERE movement_type  = 'outbound'
      AND movement_date >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY product_id
),
inbound_total AS (
    SELECT product_id, SUM(quantity) AS total_inbound
    FROM stock_movements
    WHERE movement_type = 'inbound'
    GROUP BY product_id
),
outbound_total AS (
    SELECT product_id, SUM(quantity) AS total_outbound
    FROM stock_movements
    WHERE movement_type = 'outbound'
    GROUP BY product_id
)
SELECT
    p.product_id,
    p.sku,
    p.name                                                              AS product_name,
    c.name                                                              AS category_name,
    i.quantity_on_hand,
    p.reorder_level,
    COALESCE(o30.avg_monthly_outbound, 0)                              AS avg_monthly_outbound,
    -- Months of cover: how long current stock lasts at current velocity
    CASE
        WHEN COALESCE(o30.avg_monthly_outbound, 0) > 0
        THEN ROUND(i.quantity_on_hand / o30.avg_monthly_outbound, 1)
        ELSE NULL
    END                                                                AS months_of_cover,
    -- Turnover ratio: total outbound ÷ average stock (proxy for the period)
    ROUND(
        COALESCE(ot.total_outbound, 0)::NUMERIC
        / NULLIF((COALESCE(it.total_inbound, 0) + i.quantity_on_hand) / 2.0, 0),
        2
    )                                                                  AS turnover_ratio,
    -- NTILE classifies all products into 4 velocity buckets by avg monthly outbound
    NTILE(4) OVER (ORDER BY COALESCE(o30.avg_monthly_outbound, 0) DESC) AS velocity_quartile,
    CASE
        NTILE(4) OVER (ORDER BY COALESCE(o30.avg_monthly_outbound, 0) DESC)
        WHEN 1 THEN 'Fast Moving'
        WHEN 2 THEN 'Moderate'
        WHEN 3 THEN 'Slow Moving'
        WHEN 4 THEN 'Very Slow / Dead Stock'
    END                                                                AS velocity_label,
    -- Risk flags: overstock = >12 months cover; stockout risk = <2 months cover & low stock
    CASE
        WHEN COALESCE(o30.avg_monthly_outbound, 0) > 0
             AND i.quantity_on_hand / o30.avg_monthly_outbound > 12  THEN 'overstock_risk'
        WHEN COALESCE(o30.avg_monthly_outbound, 0) > 0
             AND i.quantity_on_hand / o30.avg_monthly_outbound < 2
             AND i.quantity_on_hand < p.reorder_level * 2            THEN 'stockout_risk'
        WHEN i.quantity_on_hand = 0                                  THEN 'out_of_stock'
        ELSE 'healthy'
    END                                                                AS risk_flag
FROM products         p
JOIN categories       c  ON c.category_id = p.category_id
JOIN inventory        i  ON i.product_id  = p.product_id
LEFT JOIN outbound_30d o30 ON o30.product_id = p.product_id
LEFT JOIN inbound_total it  ON it.product_id  = p.product_id
LEFT JOIN outbound_total ot ON ot.product_id  = p.product_id
WHERE p.is_active = TRUE
  AND (CAST(:category_id AS INTEGER) IS NULL OR p.category_id = CAST(:category_id AS INTEGER))
ORDER BY avg_monthly_outbound DESC
