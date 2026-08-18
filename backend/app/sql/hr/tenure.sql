-- Business question: How is tenure distributed across the workforce?
SELECT
    e.employee_id,
    e.full_name,
    d.name                                                             AS department_name,
    e.job_level,
    e.hire_date,
    ROUND((
        EXTRACT(YEAR  FROM age(COALESCE(e.exit_date, CURRENT_DATE), e.hire_date)) * 12
      + EXTRACT(MONTH FROM age(COALESCE(e.exit_date, CURRENT_DATE), e.hire_date))
    )::NUMERIC, 1)                                                     AS tenure_months,
    -- Tenure bucket for histogram binning
    CASE
        WHEN (EXTRACT(YEAR  FROM age(COALESCE(e.exit_date, CURRENT_DATE), e.hire_date)) * 12
            + EXTRACT(MONTH FROM age(COALESCE(e.exit_date, CURRENT_DATE), e.hire_date))) < 12
        THEN '0–1 yr'
        WHEN (EXTRACT(YEAR  FROM age(COALESCE(e.exit_date, CURRENT_DATE), e.hire_date)) * 12
            + EXTRACT(MONTH FROM age(COALESCE(e.exit_date, CURRENT_DATE), e.hire_date))) < 36
        THEN '1–3 yr'
        WHEN (EXTRACT(YEAR  FROM age(COALESCE(e.exit_date, CURRENT_DATE), e.hire_date)) * 12
            + EXTRACT(MONTH FROM age(COALESCE(e.exit_date, CURRENT_DATE), e.hire_date))) < 60
        THEN '3–5 yr'
        ELSE '5+ yr'
    END                                                                AS tenure_bucket,
    e.status
FROM employees   e
JOIN departments d ON d.department_id = e.department_id
WHERE (CAST(:department_id AS INTEGER) IS NULL OR e.department_id = CAST(:department_id AS INTEGER))
ORDER BY tenure_months DESC
