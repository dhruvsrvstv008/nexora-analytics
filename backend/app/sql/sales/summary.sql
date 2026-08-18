-- Business question: What are the top-line KPIs for the selected period?
-- Returns revenue, profit, order count, AOV for the current period
-- and the same metrics for the prior year-period so the API can compute deltas.
WITH current_period AS (
    SELECT
        COUNT(DISTINCT s.sale_id)                                        AS total_orders,
        COALESCE(SUM(s.total_amount), 0)                                 AS revenue,
        COALESCE(SUM((si.unit_price - si.unit_cost) * si.quantity), 0)  AS profit,
        CASE
            WHEN COUNT(DISTINCT s.sale_id) > 0
            THEN ROUND(SUM(s.total_amount)::NUMERIC / COUNT(DISTINCT s.sale_id), 2)
            ELSE 0
        END                                                              AS avg_order_value
    FROM sales s
    JOIN sale_items si ON si.sale_id    = s.sale_id
    JOIN employees  e  ON e.employee_id = s.employee_id
    WHERE s.status = 'completed'
      AND (CAST(:year AS INTEGER)          IS NULL OR EXTRACT(YEAR  FROM s.order_date) = CAST(:year AS INTEGER))
      AND (CAST(:month AS INTEGER)         IS NULL OR EXTRACT(MONTH FROM s.order_date) = CAST(:month AS INTEGER))
      AND (CAST(:department_id AS INTEGER) IS NULL OR e.department_id = CAST(:department_id AS INTEGER))
      AND (CAST(:region_id AS INTEGER)     IS NULL OR s.region_id     = CAST(:region_id AS INTEGER))
),
prior_period AS (
    -- Prior-year same period for delta calculation
    SELECT
        COUNT(DISTINCT s.sale_id)                                        AS total_orders,
        COALESCE(SUM(s.total_amount), 0)                                 AS revenue,
        COALESCE(SUM((si.unit_price - si.unit_cost) * si.quantity), 0)  AS profit
    FROM sales s
    JOIN sale_items si ON si.sale_id    = s.sale_id
    JOIN employees  e  ON e.employee_id = s.employee_id
    WHERE s.status = 'completed'
      AND (
            CAST(:year AS INTEGER) IS NULL
            OR EXTRACT(YEAR FROM s.order_date) = CAST(:year AS INTEGER) - 1
          )
      AND (CAST(:month AS INTEGER)         IS NULL OR EXTRACT(MONTH FROM s.order_date) = CAST(:month AS INTEGER))
      AND (CAST(:department_id AS INTEGER) IS NULL OR e.department_id = CAST(:department_id AS INTEGER))
      AND (CAST(:region_id AS INTEGER)     IS NULL OR s.region_id     = CAST(:region_id AS INTEGER))
)
SELECT
    c.total_orders,
    c.revenue,
    c.profit,
    c.avg_order_value,
    p.revenue      AS prev_revenue,
    p.profit       AS prev_profit,
    p.total_orders AS prev_orders,
    ROUND(CASE WHEN p.revenue  > 0 THEN (c.revenue - p.revenue)  / p.revenue  * 100 ELSE NULL END, 2) AS revenue_growth_pct,
    ROUND(CASE WHEN p.profit   > 0 THEN (c.profit  - p.profit)   / p.profit   * 100 ELSE NULL END, 2) AS profit_growth_pct,
    ROUND(CASE WHEN c.revenue  > 0 THEN  c.profit  / c.revenue   * 100              ELSE 0    END, 2) AS profit_margin_pct
FROM current_period c, prior_period p
