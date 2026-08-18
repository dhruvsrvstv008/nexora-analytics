-- Business question: What are the recent orders? (paginated feed)
SELECT
    s.sale_id,
    s.order_number,
    s.order_date,
    s.status,
    s.payment_method,
    s.customer_name,
    s.total_amount,
    s.discount,
    e.full_name                   AS employee_name,
    d.name                        AS department_name,
    r.name                        AS region_name,
    r.zone,
    COUNT(si.sale_item_id)        AS item_count
FROM sales s
JOIN employees  e  ON e.employee_id   = s.employee_id
JOIN departments d ON d.department_id = e.department_id
JOIN regions    r  ON r.region_id     = s.region_id
JOIN sale_items si ON si.sale_id      = s.sale_id
WHERE (CAST(:year AS INTEGER)          IS NULL OR EXTRACT(YEAR  FROM s.order_date) = CAST(:year AS INTEGER))
  AND (CAST(:month AS INTEGER)         IS NULL OR EXTRACT(MONTH FROM s.order_date) = CAST(:month AS INTEGER))
  AND (CAST(:department_id AS INTEGER) IS NULL OR e.department_id = CAST(:department_id AS INTEGER))
  AND (CAST(:region_id AS INTEGER)     IS NULL OR s.region_id     = CAST(:region_id AS INTEGER))
  AND (CAST(:status AS TEXT)           IS NULL OR s.status        = CAST(:status AS TEXT))
GROUP BY s.sale_id, s.order_number, s.order_date, s.status, s.payment_method,
         s.customer_name, s.total_amount, s.discount,
         e.full_name, d.name, r.name, r.zone
ORDER BY s.order_date DESC, s.sale_id DESC
LIMIT  :limit
OFFSET :offset
