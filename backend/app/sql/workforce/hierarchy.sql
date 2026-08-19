-- Business question: What does the reporting structure look like from top to bottom?
-- Recursive CTE walks the manager_id self-reference to compute each employee's
-- depth, path, and full reporting chain — the interview showpiece query.
WITH RECURSIVE org_tree AS (
    -- Base case: the executive with no manager (root of the tree)
    SELECT
        e.employee_id,
        e.full_name,
        e.department_id,
        d.name                              AS department_name,
        e.job_title,
        e.job_level,
        e.salary,
        e.hire_date,
        e.manager_id,
        0                                   AS depth,
        ARRAY[e.employee_id]                AS path,
        e.full_name::TEXT                   AS reporting_chain
    FROM employees e
    JOIN departments d ON d.department_id = e.department_id
    WHERE e.manager_id IS NULL
      AND e.status = 'active'

    UNION ALL

    -- Recursive case: join each employee to their manager already in the tree
    SELECT
        e.employee_id,
        e.full_name,
        e.department_id,
        d.name,
        e.job_title,
        e.job_level,
        e.salary,
        e.hire_date,
        e.manager_id,
        ot.depth + 1,
        ot.path || e.employee_id,
        ot.reporting_chain || ' → ' || e.full_name
    FROM employees   e
    JOIN departments d  ON d.department_id = e.department_id
    JOIN org_tree    ot ON ot.employee_id  = e.manager_id
    WHERE e.status = 'active'
      -- Cycle guard: never visit an employee_id already on the path
      AND NOT (e.employee_id = ANY(ot.path))
)
SELECT
    ot.employee_id,
    ot.full_name,
    ot.department_id,
    ot.department_name,
    ot.job_title,
    ot.job_level,
    ot.salary,
    ot.hire_date,
    ot.manager_id,
    ot.depth,
    ot.reporting_chain,
    -- Count of direct reports (one sub-select per row; efficient with manager_id index)
    (
        SELECT COUNT(*)
        FROM   employees sub
        WHERE  sub.manager_id = ot.employee_id
          AND  sub.status     = 'active'
    )                                      AS direct_report_count
FROM org_tree ot
WHERE (CAST(:department_id AS INTEGER) IS NULL OR ot.department_id = CAST(:department_id AS INTEGER))
ORDER BY ot.path
