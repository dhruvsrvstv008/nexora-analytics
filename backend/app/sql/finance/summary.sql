-- Business question: What are the top-line financial KPIs?
WITH rev AS (
    SELECT
        COALESCE(SUM(s.total_amount), 0)                               AS revenue,
        COALESCE(SUM((si.unit_price - si.unit_cost) * si.quantity), 0) AS gross_profit
    FROM sales s
    JOIN sale_items si ON si.sale_id = s.sale_id
    WHERE s.status = 'completed'
      AND (CAST(:year AS INTEGER) IS NULL OR EXTRACT(YEAR FROM s.order_date) = CAST(:year AS INTEGER))
),
exp AS (
    SELECT COALESCE(SUM(amount), 0) AS total_expenses
    FROM expenses
    WHERE (CAST(:year AS INTEGER) IS NULL OR EXTRACT(YEAR FROM expense_date) = CAST(:year AS INTEGER))
),
hc AS (
    SELECT COUNT(*) AS headcount
    FROM employees
    WHERE status = 'active'
)
SELECT
    r.revenue,
    r.gross_profit,
    e.total_expenses,
    ROUND((r.gross_profit - e.total_expenses)::NUMERIC, 2)            AS net_profit,
    ROUND(r.gross_profit / NULLIF(r.revenue, 0) * 100, 2)             AS gross_margin_pct,
    ROUND((r.gross_profit - e.total_expenses) / NULLIF(r.revenue, 0) * 100, 2) AS net_margin_pct,
    ROUND(e.total_expenses / NULLIF(hc.headcount, 0)::NUMERIC, 2)     AS cost_per_employee
FROM rev r, exp e, hc
