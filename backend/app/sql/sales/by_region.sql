-- Business question: Which geographic regions drive the most revenue?
SELECT
    r.region_id,
    r.name                                                              AS region_name,
    r.zone,
    COUNT(DISTINCT s.sale_id)                                          AS total_orders,
    ROUND(SUM(s.total_amount)::NUMERIC, 2)                            AS revenue,
    ROUND(SUM((si.unit_price - si.unit_cost) * si.quantity)::NUMERIC, 2) AS profit,
    ROUND(SUM(s.total_amount)::NUMERIC / NULLIF(COUNT(DISTINCT s.sale_id), 0), 2) AS avg_order_value,
    ROUND(
        SUM(s.total_amount) / NULLIF(SUM(SUM(s.total_amount)) OVER (), 0) * 100,
        2
    )                                                                  AS revenue_share_pct,
    RANK() OVER (ORDER BY SUM(s.total_amount) DESC)                   AS revenue_rank
FROM sales s
JOIN sale_items si ON si.sale_id    = s.sale_id
JOIN regions    r  ON r.region_id   = s.region_id
JOIN employees  e  ON e.employee_id = s.employee_id
WHERE s.status = 'completed'
  AND (CAST(:year AS INTEGER)          IS NULL OR EXTRACT(YEAR  FROM s.order_date) = CAST(:year AS INTEGER))
  AND (CAST(:month AS INTEGER)         IS NULL OR EXTRACT(MONTH FROM s.order_date) = CAST(:month AS INTEGER))
  AND (CAST(:department_id AS INTEGER) IS NULL OR e.department_id = CAST(:department_id AS INTEGER))
GROUP BY r.region_id, r.name, r.zone
ORDER BY revenue DESC
