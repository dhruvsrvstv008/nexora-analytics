-- Business question: Which managers lead the highest-performing teams?
-- Aggregates all sales made by each manager's direct reports.
SELECT
    mgr.employee_id                                                     AS manager_id,
    mgr.full_name                                                       AS manager_name,
    d.name                                                              AS department_name,
    COUNT(DISTINCT e.employee_id)                                       AS team_size,
    COUNT(DISTINCT s.sale_id)                                          AS total_orders,
    ROUND(SUM(s.total_amount)::NUMERIC, 2)                            AS revenue,
    ROUND(SUM((si.unit_price - si.unit_cost) * si.quantity)::NUMERIC, 2) AS profit,
    ROUND(SUM(s.total_amount)::NUMERIC / NULLIF(COUNT(DISTINCT s.sale_id), 0), 2) AS avg_order_value,
    RANK() OVER (ORDER BY SUM(s.total_amount) DESC)                    AS revenue_rank
FROM employees mgr
JOIN employees  e  ON e.manager_id  = mgr.employee_id AND e.status = 'active'
JOIN departments d ON d.department_id = mgr.department_id
JOIN sales      s  ON s.employee_id = e.employee_id AND s.status = 'completed'
JOIN sale_items si ON si.sale_id    = s.sale_id
WHERE mgr.job_level = 'manager'
  AND (CAST(:year AS INTEGER)          IS NULL OR EXTRACT(YEAR  FROM s.order_date) = CAST(:year AS INTEGER))
  AND (CAST(:month AS INTEGER)         IS NULL OR EXTRACT(MONTH FROM s.order_date) = CAST(:month AS INTEGER))
  AND (CAST(:department_id AS INTEGER) IS NULL OR mgr.department_id = CAST(:department_id AS INTEGER))
GROUP BY mgr.employee_id, mgr.full_name, d.name
ORDER BY revenue DESC
