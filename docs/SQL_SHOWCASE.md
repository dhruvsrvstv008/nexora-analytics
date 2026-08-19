# SQL Showcase

> The 15 most illustrative queries in this project, each with the business question it answers and a note on *why* it's written the way it is.  
> Full source lives in `backend/app/sql/`. All queries use named bind parameters (`:year`, `:department_id`) — no string interpolation.

---

## 1. Month-over-month revenue growth with `LAG()`

**File:** `sales/monthly_trend.sql`  
**Business question:** How is revenue trending month-over-month, and is growth accelerating or decelerating?

```sql
WITH monthly AS (
    SELECT
        date_trunc('month', s.order_date)::date AS period,
        COUNT(DISTINCT s.sale_id)               AS order_count,
        ROUND(SUM(s.total_amount)::NUMERIC, 2)  AS revenue,
        ROUND(SUM((si.unit_price - si.unit_cost) * si.quantity)::NUMERIC, 2) AS profit
    FROM sales s
    JOIN sale_items si ON si.sale_id = s.sale_id
    WHERE s.status = 'completed'
    GROUP BY 1
)
SELECT
    period,
    order_count,
    revenue,
    profit,
    LAG(revenue) OVER (ORDER BY period)          AS prev_revenue,
    ROUND(
        (revenue - LAG(revenue) OVER (ORDER BY period))
        / NULLIF(LAG(revenue) OVER (ORDER BY period), 0) * 100,
        2
    )                                            AS revenue_growth_pct,
    SUM(revenue) OVER (
        ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )                                            AS cumulative_revenue
FROM monthly
ORDER BY period
```

**Why it's written this way:** `LAG()` retrieves the previous row's revenue within the same ordered window — no self-join, no subquery. The CTE (`monthly`) computes aggregates once; the outer query applies window functions over those results. `NULLIF(..., 0)` prevents a division-by-zero on the first month.

---

## 2. Running cumulative revenue with `SUM() OVER`

**Extracted from:** `sales/monthly_trend.sql` (same query, different column)

```sql
SUM(revenue) OVER (
    ORDER BY period
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
) AS cumulative_revenue
```

**Why it's written this way:** The explicit `ROWS BETWEEN` frame clause is more precise than the default `RANGE BETWEEN` — it handles ties deterministically when two periods have the same sort key. The result lets the frontend draw a running total line without any client-side arithmetic.

---

## 3. Revenue share per department using a window aggregate

**File:** `sales/by_department.sql`  
**Business question:** Which departments drive revenue and what share of the total does each own?

```sql
SELECT
    d.name AS department_name,
    COUNT(DISTINCT s.sale_id)                            AS total_orders,
    ROUND(SUM(s.total_amount)::NUMERIC, 2)               AS revenue,
    ROUND(
        SUM(s.total_amount) / SUM(SUM(s.total_amount)) OVER () * 100,
        2
    )                                                    AS revenue_share_pct
FROM sales s
JOIN sale_items si ON si.sale_id    = s.sale_id
JOIN employees  e  ON e.employee_id = s.employee_id
JOIN departments d ON d.department_id = e.department_id
WHERE s.status = 'completed'
GROUP BY d.department_id, d.name
ORDER BY revenue DESC
```

**Why it's written this way:** `SUM(SUM(s.total_amount)) OVER ()` is a nested aggregate — the inner `SUM` is the GROUP BY aggregate, the outer `SUM ... OVER ()` is a window function over those group subtotals. This computes the grand total in a single pass without a subquery or CTE.

---

## 4. Target vs actual with `CASE` bucketing and `RANK()`

**File:** `sales/target_vs_actual.sql`  
**Business question:** Who is exceeding, meeting, or missing their targets, and how do they rank within each period?

```sql
SELECT
    e.full_name,
    t.period_month,
    COALESCE(a.actual_revenue, 0)                        AS actual_revenue,
    t.target_amount,
    ROUND(
        COALESCE(a.actual_revenue, 0) / NULLIF(t.target_amount, 0) * 100,
        2
    )                                                    AS achievement_pct,
    CASE
        WHEN COALESCE(a.actual_revenue, 0) >= t.target_amount * 1.10 THEN 'Exceeded'
        WHEN COALESCE(a.actual_revenue, 0) >= t.target_amount        THEN 'Met'
        ELSE                                                               'Missed'
    END                                                  AS performance_tier,
    RANK() OVER (
        PARTITION BY t.period_month
        ORDER BY COALESCE(a.actual_revenue, 0) DESC
    )                                                    AS rank_in_period
FROM targets t
JOIN employees e ON e.employee_id = t.employee_id
LEFT JOIN (...) a ON a.employee_id = t.employee_id AND a.period_month = t.period_month
```

**Why it's written this way:** The `CASE` tiers encode business rules as data, not application logic. `RANK() OVER (PARTITION BY period_month)` gives an independent leaderboard per month — one query returns a sortable table for any time range.

---

## 5. Top 10 products — `RANK()` vs `DENSE_RANK()`

**File:** `sales/top_products.sql`  
**Business question:** What are the top-selling products, and what is the difference between rank and dense rank?

```sql
SELECT
    p.name          AS product_name,
    SUM(si.line_total)          AS revenue,
    RANK()       OVER (ORDER BY SUM(si.line_total) DESC) AS rank,
    DENSE_RANK() OVER (ORDER BY SUM(si.line_total) DESC) AS dense_rank
FROM sale_items si
JOIN products p ON p.product_id = si.product_id
JOIN sales    s ON s.sale_id    = si.sale_id AND s.status = 'completed'
GROUP BY p.product_id, p.name
ORDER BY revenue DESC
LIMIT 10
```

**Why it's written this way:** `RANK()` skips numbers after ties (1, 2, 2, 4); `DENSE_RANK()` never skips (1, 2, 2, 3). Both are computed in the same query to make the distinction concrete. The query is kept in the showcase specifically because interviewers ask about this difference.

---

## 6. Top 3 products per category — `ROW_NUMBER() PARTITION BY`

**File:** `sales/top_per_category.sql`  
**Business question:** What are the top 3 revenue-driving products within each product category?

```sql
WITH ranked AS (
    SELECT
        c.name     AS category_name,
        p.name     AS product_name,
        SUM(si.line_total) AS revenue,
        ROW_NUMBER() OVER (
            PARTITION BY c.category_id
            ORDER BY SUM(si.line_total) DESC
        )          AS rank_in_category
    FROM sale_items si
    JOIN products   p ON p.product_id  = si.product_id
    JOIN categories c ON c.category_id = p.category_id
    JOIN sales      s ON s.sale_id     = si.sale_id AND s.status = 'completed'
    GROUP BY c.category_id, c.name, p.product_id, p.name
)
SELECT * FROM ranked WHERE rank_in_category <= 3
ORDER BY category_id, rank_in_category
```

**Why it's written this way:** `PARTITION BY category_id` resets the row counter for each category — a single query returns 10 independent top-3 lists (one per category) without any application-side grouping. The CTE keeps the filter (`<= 3`) separate from the ranking logic.

---

## 7. Employees above department average — CTE version

**File:** `workforce/above_dept_avg_cte.sql`  
**Business question:** Which employees earn more than their department's average salary?

```sql
WITH dept_averages AS (
    SELECT department_id, ROUND(AVG(salary)::NUMERIC, 2) AS avg_salary
    FROM employees
    WHERE status = 'active'
    GROUP BY department_id
)
SELECT
    e.full_name,
    d.name                              AS department_name,
    e.salary,
    da.avg_salary                       AS dept_avg_salary,
    ROUND(e.salary - da.avg_salary, 2)  AS salary_premium
FROM employees    e
JOIN departments  d  ON d.department_id  = e.department_id
JOIN dept_averages da ON da.department_id = e.department_id
WHERE e.status = 'active'
  AND e.salary > da.avg_salary
ORDER BY salary_premium DESC
```

**Why it's written this way:** The CTE computes department averages once (O(n) over employees). The alternative — a correlated subquery — re-runs the `AVG()` for every outer row. Both versions are kept in the codebase; see query 8 for the comparison.

---

## 8. Same question — correlated subquery version

**File:** `workforce/above_dept_avg_correlated.sql`  
**Business question:** (same as query 7 — kept for comparison)

```sql
SELECT
    e.full_name,
    d.name      AS department_name,
    e.salary,
    ROUND(
        (SELECT AVG(e2.salary) FROM employees e2
         WHERE  e2.department_id = e.department_id AND e2.status = 'active'),
        2
    )           AS dept_avg_salary
FROM employees e
JOIN departments d ON d.department_id = e.department_id
WHERE e.status = 'active'
  AND e.salary > (
      SELECT AVG(e2.salary) FROM employees e2
      WHERE  e2.department_id = e.department_id AND e2.status = 'active'
  )
ORDER BY e.salary DESC
```

**Why it's written this way:** The correlated subquery runs once per outer row — easy to read but O(n × d) where d is the number of departments. On 200 employees across 8 departments, the CTE version (query 7) executes 8 aggregations; this version executes up to 400. Both are correct; the CTE is the production choice.

---

## 9. Salary `RANK()` within each department — `PARTITION BY`

**File:** `workforce/salary_department_rank.sql`  
**Business question:** Who are the top earners within each department?

```sql
SELECT
    e.full_name,
    d.name     AS department_name,
    e.salary,
    RANK() OVER (
        PARTITION BY e.department_id
        ORDER BY e.salary DESC
    )          AS dept_salary_rank,
    ROUND(
        AVG(e.salary) OVER (PARTITION BY e.department_id)::NUMERIC,
        2
    )          AS dept_avg_salary
FROM employees e
JOIN departments d ON d.department_id = e.department_id
WHERE e.status = 'active'
ORDER BY e.department_id, dept_salary_rank
```

**Why it's written this way:** Two different `PARTITION BY` windows in the same query — one for ranking, one for the department average. PostgreSQL evaluates each window frame independently, all in one scan.

---

## 10. Salary percentile bands with `NTILE(4)`

**File:** `workforce/salary_percentile_bands.sql`  
**Business question:** How are employees distributed across salary quartiles?

```sql
-- NTILE must be materialised in a CTE before it can be used as a PARTITION BY key.
-- PostgreSQL does not allow window functions inside window definitions.
WITH bucketed AS (
    SELECT
        e.employee_id,
        e.full_name,
        d.name                             AS department_name,
        e.job_title,
        e.job_level,
        e.salary,
        NTILE(4) OVER (ORDER BY e.salary)  AS salary_quartile
    FROM employees   e
    JOIN departments d ON d.department_id = e.department_id
    WHERE e.status = 'active'
)
SELECT
    employee_id,
    full_name,
    department_name,
    job_title,
    job_level,
    salary,
    salary_quartile,
    CASE salary_quartile
        WHEN 1 THEN 'Q1 — Bottom 25%'
        WHEN 2 THEN 'Q2 — Lower Mid'
        WHEN 3 THEN 'Q3 — Upper Mid'
        WHEN 4 THEN 'Q4 — Top 25%'
    END                                    AS quartile_label,
    RANK() OVER (
        PARTITION BY salary_quartile
        ORDER BY salary DESC
    )                                      AS rank_in_quartile
FROM bucketed
ORDER BY salary DESC
```

**Why it's written this way:** `NTILE(4)` divides the ordered result into 4 equal-size buckets — bucket 1 is the bottom 25%, bucket 4 the top 25%. The CTE is required because PostgreSQL forbids window functions inside another window's `PARTITION BY` definition: you cannot write `RANK() OVER (PARTITION BY NTILE(4) OVER (...))` directly. Materialising `NTILE` in `bucketed` first lets the outer `RANK() OVER (PARTITION BY salary_quartile)` reference it as a plain column.

---

## 11. Payroll share — `SUM() OVER ()` with no partition

**File:** `workforce/payroll_share.sql`  
**Business question:** What percentage of total company payroll does each department consume?

```sql
SELECT
    d.name   AS department_name,
    ROUND(SUM(e.salary)::NUMERIC, 2)         AS monthly_payroll,
    ROUND(
        SUM(e.salary) / SUM(SUM(e.salary)) OVER () * 100,
        2
    )                                        AS payroll_share_pct
FROM employees   e
JOIN departments d ON d.department_id = e.department_id
WHERE e.status = 'active'
GROUP BY d.department_id, d.name
ORDER BY monthly_payroll DESC
```

**Why it's written this way:** `SUM(SUM(e.salary)) OVER ()` — a window function with no `PARTITION BY` — computes the grand total across all groups, making it possible to express each department's share as a percentage in a single query. The nested aggregate pattern (`SUM(SUM(...)) OVER`) is idiomatic PostgreSQL.

---

## 12. Recursive CTE org hierarchy ⭐ Interview showpiece

**File:** `workforce/hierarchy.sql`  
**Business question:** What does the full reporting structure look like, and how deep is each employee in the chain?

```sql
WITH RECURSIVE org_tree AS (
    -- Base case: executives with no manager.
    -- reporting_chain is cast to TEXT so the type matches the recursive term,
    -- where string concatenation always produces TEXT regardless of input width.
    -- Omitting the cast causes a DatatypeMismatch error across the UNION ALL.
    SELECT
        e.employee_id, e.full_name, e.manager_id,
        0                      AS depth,
        ARRAY[e.employee_id]   AS path,
        e.full_name::TEXT      AS reporting_chain
    FROM employees e
    WHERE e.manager_id IS NULL AND e.status = 'active'

    UNION ALL

    -- Recursive case: each employee joined to their manager already in the tree
    SELECT
        e.employee_id, e.full_name, e.manager_id,
        ot.depth + 1,
        ot.path || e.employee_id,
        ot.reporting_chain || ' → ' || e.full_name
    FROM employees e
    JOIN org_tree ot ON ot.employee_id = e.manager_id
    WHERE e.status = 'active'
      AND NOT (e.employee_id = ANY(ot.path))   -- cycle guard
)
SELECT
    ot.*,
    (SELECT COUNT(*) FROM employees sub
     WHERE sub.manager_id = ot.employee_id AND sub.status = 'active') AS direct_report_count
FROM org_tree ot
ORDER BY ot.path
```

**Why it's written this way:** The recursive CTE has two parts separated by `UNION ALL`. The base case seeds the tree with root employees; the recursive case joins each employee to their manager's row. The `path` array accumulates visited employee IDs — the `NOT (... = ANY(path))` guard prevents infinite loops if there is a data cycle. The `reporting_chain` string builds a readable ancestry path in one pass.

The `::TEXT` cast on `e.full_name` in the base case is load-bearing: PostgreSQL infers the output column type from the non-recursive term. `full_name` is `VARCHAR(150)`, but concatenation in the recursive term (`ot.reporting_chain || ' → ' || e.full_name`) always produces `TEXT`. Without the cast the engine raises `DatatypeMismatch: recursive query column has type character varying(150) in non-recursive term but type character varying overall`. The direct-report count is a correlated subquery; acceptable here because it runs once per row on an indexed column.

---

## 13. Inventory velocity — `NTILE` + months-of-cover + risk flags

**File:** `inventory/velocity.sql`  
**Business question:** Which products sell quickly vs slowly, and which are at risk of stockout or overstock?

```sql
WITH outbound_30d AS (
    SELECT product_id,
           ROUND(SUM(quantity)::NUMERIC / 6, 2) AS avg_monthly_outbound
    FROM stock_movements
    WHERE movement_type = 'outbound'
      AND movement_date >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY product_id
)
SELECT
    p.name,
    i.quantity_on_hand,
    COALESCE(o30.avg_monthly_outbound, 0)                AS avg_monthly_outbound,
    CASE WHEN COALESCE(o30.avg_monthly_outbound, 0) > 0
         THEN ROUND(i.quantity_on_hand / o30.avg_monthly_outbound, 1)
         ELSE NULL
    END                                                  AS months_of_cover,
    NTILE(4) OVER (ORDER BY COALESCE(o30.avg_monthly_outbound, 0) DESC) AS velocity_quartile,
    CASE
        WHEN ... AND months_of_cover > 12  THEN 'overstock_risk'
        WHEN ... AND months_of_cover < 2   THEN 'stockout_risk'
        WHEN i.quantity_on_hand = 0        THEN 'out_of_stock'
        ELSE                                    'healthy'
    END                                                  AS risk_flag
FROM products p
JOIN inventory i       ON i.product_id  = p.product_id
LEFT JOIN outbound_30d ON outbound_30d.product_id = p.product_id
```

**Why it's written this way:** `NTILE(4)` classifies all 450 products into Fast / Moderate / Slow / Dead Stock without choosing arbitrary thresholds — the buckets are relative to the product mix. Months-of-cover (`stock ÷ avg_monthly_outbound`) is an operations-standard metric that makes overstock and stockout risk comparable across products with very different volumes.

---

## 14. Department P&L — `FULL OUTER JOIN` between two CTEs

**File:** `finance/dept_pnl.sql`  
**Business question:** Which departments are profitable after accounting for their direct costs?

```sql
WITH dept_revenue AS (
    SELECT e.department_id,
           ROUND(SUM(s.total_amount)::NUMERIC, 2)    AS revenue,
           ROUND(SUM((si.unit_price - si.unit_cost) * si.quantity)::NUMERIC, 2) AS gross_profit
    FROM sales s
    JOIN sale_items si ON si.sale_id    = s.sale_id
    JOIN employees  e  ON e.employee_id = s.employee_id
    WHERE s.status = 'completed'
    GROUP BY e.department_id
),
dept_expenses AS (
    SELECT department_id,
           ROUND(SUM(amount)::NUMERIC, 2) AS total_expenses
    FROM expenses
    GROUP BY department_id
)
SELECT
    d.name                                                   AS department_name,
    COALESCE(r.revenue, 0)                                   AS revenue,
    COALESCE(r.gross_profit, 0)                              AS gross_profit,
    COALESCE(e.total_expenses, 0)                            AS total_expenses,
    COALESCE(r.gross_profit, 0) - COALESCE(e.total_expenses, 0) AS net_profit
FROM departments d
FULL OUTER JOIN dept_revenue  r ON r.department_id = d.department_id
FULL OUTER JOIN dept_expenses e ON e.department_id = d.department_id
ORDER BY net_profit DESC
```

**Why it's written this way:** `FULL OUTER JOIN` ensures every department appears even if it has no revenue (e.g., HR) or no recorded expenses. An `INNER JOIN` would silently drop those rows. `COALESCE(..., 0)` handles the NULLs that a FULL OUTER JOIN produces for unmatched sides.

---

## 15. Headcount growth — year-over-year via CTE comparison

**File:** `workforce/summary.sql`  
**Business question:** How many employees were active this time last year, compared to now?

```sql
WITH headcount AS (
    SELECT
        COUNT(*) FILTER (WHERE status = 'active')    AS active_count,
        COUNT(*) FILTER (WHERE status = 'active'
          AND hire_date >= date_trunc('year', CURRENT_DATE)) AS new_hires_ytd,
        COUNT(*) FILTER (WHERE status IN ('resigned','terminated')
          AND exit_date >= date_trunc('year', CURRENT_DATE)) AS exits_ytd
    FROM employees
),
prev_year AS (
    SELECT COUNT(*) AS headcount_prev_year
    FROM employees
    WHERE status = 'active'
      AND hire_date < date_trunc('year', CURRENT_DATE)
      AND (exit_date IS NULL OR exit_date >= date_trunc('year', CURRENT_DATE))
)
SELECT
    h.active_count,
    h.new_hires_ytd,
    h.exits_ytd,
    p.headcount_prev_year,
    ROUND(h.exits_ytd::NUMERIC / NULLIF(h.active_count + h.exits_ytd, 0) * 100, 2)
        AS attrition_rate_pct
FROM headcount h, prev_year p
```

**Why it's written this way:** Two independent CTEs (`headcount`, `prev_year`) compute different slices of the same table, then the final SELECT cross-joins their single-row results. `FILTER (WHERE ...)` is the PostgreSQL aggregate filter clause — more readable than `CASE WHEN` inside `SUM()` and, in most cases, faster because the planner can push the filter earlier. The `prev_year` CTE is what powers `rule_headcount_growth` in the insights engine.

---

*All 40+ analytics queries are in `backend/app/sql/`. The full service layer that executes them is in `backend/app/services/`.*
