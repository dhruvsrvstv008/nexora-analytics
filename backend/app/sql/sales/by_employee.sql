-- Business question: How does each salesperson rank by revenue and target achievement?
SELECT
    e.employee_id,
    e.full_name,
    d.name                                                              AS department_name,
    e.job_title,
    e.job_level,
    mgr.full_name                                                       AS manager_name,
    COUNT(DISTINCT s.sale_id)                                          AS total_orders,
    ROUND(SUM(s.total_amount)::NUMERIC, 2)                            AS revenue,
    ROUND(SUM((si.unit_price - si.unit_cost) * si.quantity)::NUMERIC, 2) AS profit,
    ROUND(SUM(s.total_amount)::NUMERIC / NULLIF(COUNT(DISTINCT s.sale_id), 0), 2) AS avg_order_value,
    -- Rank within the entire sales result set
    RANK() OVER (ORDER BY SUM(s.total_amount) DESC)                    AS revenue_rank
FROM sales s
JOIN sale_items si ON si.sale_id    = s.sale_id
JOIN employees  e  ON e.employee_id = s.employee_id
JOIN departments d ON d.department_id = e.department_id
LEFT JOIN employees mgr ON mgr.employee_id = e.manager_id
WHERE s.status = 'completed'
  AND (CAST(:year AS INTEGER)          IS NULL OR EXTRACT(YEAR  FROM s.order_date) = CAST(:year AS INTEGER))
  AND (CAST(:month AS INTEGER)         IS NULL OR EXTRACT(MONTH FROM s.order_date) = CAST(:month AS INTEGER))
  AND (CAST(:department_id AS INTEGER) IS NULL OR e.department_id          = CAST(:department_id AS INTEGER))
  AND (CAST(:manager_id AS INTEGER)    IS NULL OR e.manager_id             = CAST(:manager_id AS INTEGER))
  AND (CAST(:region_id AS INTEGER)     IS NULL OR s.region_id              = CAST(:region_id AS INTEGER))
GROUP BY e.employee_id, e.full_name, d.name, e.job_title, e.job_level, mgr.full_name
ORDER BY revenue DESC
