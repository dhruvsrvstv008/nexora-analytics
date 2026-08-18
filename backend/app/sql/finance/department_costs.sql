-- Business question: What does each department spend and on what?
SELECT
    d.department_id,
    d.name                                                             AS department_name,
    ROUND(SUM(e.amount)::NUMERIC, 2)                                  AS total_expenses,
    ROUND(SUM(CASE WHEN e.expense_category = 'payroll'        THEN e.amount ELSE 0 END)::NUMERIC, 2) AS payroll,
    ROUND(SUM(CASE WHEN e.expense_category = 'operations'     THEN e.amount ELSE 0 END)::NUMERIC, 2) AS operations,
    ROUND(SUM(CASE WHEN e.expense_category = 'marketing'      THEN e.amount ELSE 0 END)::NUMERIC, 2) AS marketing,
    ROUND(SUM(CASE WHEN e.expense_category = 'infrastructure' THEN e.amount ELSE 0 END)::NUMERIC, 2) AS infrastructure,
    ROUND(SUM(CASE WHEN e.expense_category = 'misc'           THEN e.amount ELSE 0 END)::NUMERIC, 2) AS misc,
    ROUND(
        SUM(e.amount) / NULLIF(SUM(SUM(e.amount)) OVER (), 0) * 100,
        2
    )                                                                  AS expense_share_pct,
    RANK() OVER (ORDER BY SUM(e.amount) DESC)                         AS expense_rank
FROM expenses    e
JOIN departments d ON d.department_id = e.department_id
WHERE (CAST(:year AS INTEGER) IS NULL OR EXTRACT(YEAR FROM e.expense_date) = CAST(:year AS INTEGER))
GROUP BY d.department_id, d.name
ORDER BY total_expenses DESC
