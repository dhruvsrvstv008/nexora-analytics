-- Business question: How are employees distributed across salary quartiles?
-- NTILE(4) divides employees into 4 equal-size buckets sorted by salary;
-- bucket 1 = bottom 25%, bucket 4 = top 25%.
SELECT
    e.employee_id,
    e.full_name,
    d.name                             AS department_name,
    e.job_title,
    e.job_level,
    e.salary,
    NTILE(4) OVER (ORDER BY e.salary)  AS salary_quartile,
    CASE NTILE(4) OVER (ORDER BY e.salary)
        WHEN 1 THEN 'Q1 — Bottom 25%'
        WHEN 2 THEN 'Q2 — Lower Mid'
        WHEN 3 THEN 'Q3 — Upper Mid'
        WHEN 4 THEN 'Q4 — Top 25%'
    END                                AS quartile_label,
    -- Rank within quartile for fine-grained ordering
    RANK() OVER (
        PARTITION BY NTILE(4) OVER (ORDER BY e.salary)
        ORDER BY e.salary DESC
    )                                  AS rank_in_quartile
FROM employees   e
JOIN departments d ON d.department_id = e.department_id
WHERE e.status = 'active'
  AND (CAST(:department_id AS INTEGER) IS NULL OR e.department_id = CAST(:department_id AS INTEGER))
ORDER BY e.salary DESC
