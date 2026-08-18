-- Business question: How do revenue, expenses, and profit trend month by month?
WITH monthly_rev AS (
    SELECT
        date_trunc('month', s.order_date)::date                        AS period,
        ROUND(SUM(s.total_amount)::NUMERIC, 2)                        AS revenue,
        ROUND(SUM((si.unit_price - si.unit_cost) * si.quantity)::NUMERIC, 2) AS gross_profit
    FROM sales s
    JOIN sale_items si ON si.sale_id = s.sale_id
    WHERE s.status = 'completed'
      AND (CAST(:year AS INTEGER) IS NULL OR EXTRACT(YEAR FROM s.order_date) = CAST(:year AS INTEGER))
    GROUP BY 1
),
monthly_exp AS (
    SELECT
        date_trunc('month', expense_date)::date                        AS period,
        ROUND(SUM(amount)::NUMERIC, 2)                                 AS total_expenses,
        ROUND(SUM(CASE WHEN expense_category = 'payroll' THEN amount ELSE 0 END)::NUMERIC, 2) AS payroll
    FROM expenses
    WHERE (CAST(:year AS INTEGER) IS NULL OR EXTRACT(YEAR FROM expense_date) = CAST(:year AS INTEGER))
    GROUP BY 1
)
SELECT
    COALESCE(r.period, e.period)                                       AS period,
    COALESCE(r.revenue, 0)                                             AS revenue,
    COALESCE(r.gross_profit, 0)                                        AS gross_profit,
    COALESCE(e.total_expenses, 0)                                      AS total_expenses,
    COALESCE(e.payroll, 0)                                             AS payroll,
    COALESCE(r.gross_profit, 0) - COALESCE(e.total_expenses, 0)       AS net_profit,
    ROUND(
        COALESCE(r.gross_profit, 0) / NULLIF(COALESCE(r.revenue, 0), 0) * 100,
        2
    )                                                                  AS gross_margin_pct
FROM monthly_rev r
FULL OUTER JOIN monthly_exp e ON e.period = r.period
ORDER BY period
