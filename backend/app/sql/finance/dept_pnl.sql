-- Business question: Which departments are profitable after accounting for their costs?
-- FULL OUTER JOIN between two CTEs ensures departments with only expenses
-- (e.g. HR) and departments with only revenue both appear in the result.
WITH dept_revenue AS (
    SELECT
        e.department_id,
        ROUND(SUM(s.total_amount)::NUMERIC, 2)                         AS revenue,
        ROUND(SUM((si.unit_price - si.unit_cost) * si.quantity)::NUMERIC, 2) AS gross_profit
    FROM sales      s
    JOIN sale_items si ON si.sale_id    = s.sale_id
    JOIN employees  e  ON e.employee_id = s.employee_id
    WHERE s.status = 'completed'
      AND (CAST(:year AS INTEGER) IS NULL OR EXTRACT(YEAR FROM s.order_date) = CAST(:year AS INTEGER))
    GROUP BY e.department_id
),
dept_expenses AS (
    SELECT
        department_id,
        ROUND(SUM(amount)::NUMERIC, 2)                                 AS total_expenses,
        ROUND(SUM(CASE WHEN expense_category = 'payroll' THEN amount ELSE 0 END)::NUMERIC, 2) AS payroll
    FROM expenses
    WHERE (CAST(:year AS INTEGER) IS NULL OR EXTRACT(YEAR FROM expense_date) = CAST(:year AS INTEGER))
    GROUP BY department_id
)
SELECT
    d.department_id,
    d.name                                                             AS department_name,
    COALESCE(r.revenue, 0)                                             AS revenue,
    COALESCE(r.gross_profit, 0)                                        AS gross_profit,
    COALESCE(e.total_expenses, 0)                                      AS total_expenses,
    COALESCE(e.payroll, 0)                                             AS payroll,
    -- Net profit = gross profit on sales minus ALL departmental expenses
    COALESCE(r.gross_profit, 0) - COALESCE(e.total_expenses, 0)       AS net_profit,
    ROUND(
        COALESCE(r.gross_profit, 0) / NULLIF(COALESCE(r.revenue, 0), 0) * 100,
        2
    )                                                                  AS gross_margin_pct,
    ROUND(
        (COALESCE(r.gross_profit, 0) - COALESCE(e.total_expenses, 0))
        / NULLIF(COALESCE(r.revenue, 0), 0) * 100,
        2
    )                                                                  AS net_margin_pct
FROM departments d
FULL OUTER JOIN dept_revenue  r ON r.department_id = d.department_id
FULL OUTER JOIN dept_expenses e ON e.department_id = d.department_id
ORDER BY net_profit DESC
