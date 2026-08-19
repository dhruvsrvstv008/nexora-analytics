# API Reference

Base URL: `https://YOUR_RAILWAY_URL/api/v1`  
Interactive docs (Swagger UI): `https://YOUR_RAILWAY_URL/docs`

All analytics endpoints require a JWT Bearer token. Obtain one via `POST /auth/login`.

---

## Authentication

### `POST /auth/login`

```json
{ "email": "admin@nexora.dev", "password": "Admin@123" }
```

**Response 200**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

Access tokens expire in 60 min. Refresh tokens expire in 7 days.

**Errors:** `401` invalid credentials

---

### `POST /auth/refresh`

```json
{ "refresh_token": "eyJ..." }
```

**Response 200** — same shape as `/login`, new access token only.  
**Errors:** `401` token expired or invalid

---

### `GET /auth/me`

Returns the authenticated user's profile.

**Response 200**
```json
{ "user_id": 1, "email": "admin@nexora.dev", "role": "admin", "employee_id": null }
```

**Errors:** `401` missing or invalid token

---

## RBAC

| Role | What they can access |
|---|---|
| `admin` | Every endpoint |
| `analyst` | All read endpoints except individual salary records (`/salary/top-earners`, `/salary/above-department-average`, `/salary/department-rank`) |
| `manager` | Sales (scoped to own team in SQL), workforce, inventory, HR — not finance, not individual salary |
| `employee` | No analytics endpoints (own record only, not yet exposed) |

All endpoints return `401` for missing/invalid token, `403` for insufficient role.

---

## Executive

### `GET /executive/overview`

Single-payload dashboard fetch: KPI summary, revenue trend, top managers, recent orders, inventory alerts.  
**Roles:** admin, analyst, manager

---

### `GET /executive/insights`

Up to 6 rule-based insights sorted by severity (critical → warning → positive → neutral).  
**Roles:** admin, analyst, manager

**Response** — array of insight objects (see [Insights shape](#insights-shape))

---

## Sales

All sales endpoints accept optional `year` and/or `month` query params for period filtering.  
**Roles:** admin, analyst, manager (manager results are scoped to their own team)

### `GET /sales/summary`

| Param | Type | Notes |
|---|---|---|
| `year` | int | Optional |
| `month` | int | Optional |
| `department_id` | int | Optional |
| `region_id` | int | Optional |

Revenue, profit, order count, avg order value with period-over-period deltas.

---

### `GET /sales/trend`

Monthly revenue and profit with MoM growth percentage. Returns one row per calendar month.

| Param | Type |
|---|---|
| `year` | int |
| `department_id` | int |
| `region_id` | int |

---

### `GET /sales/by-dimension`

| Param | Type | Notes |
|---|---|---|
| `dim` | string | `department` \| `employee` \| `manager` \| `product` \| `category` \| `region` (default: `department`) |
| `year` | int | |
| `month` | int | |
| `department_id` | int | |
| `manager_id` | int | Ignored for manager role — always scoped to own team |
| `category_id` | int | Used with `dim=product` |
| `region_id` | int | |

Manager scoping: when a manager calls `dim=employee`, `manager_id` is forced to their own `employee_id` regardless of what they pass. They cannot view another manager's team.

---

### `GET /sales/targets`

Target vs actual with achievement percentage and performance tier (top/on-track/below/critical).

| Param | Type |
|---|---|
| `year` | int |
| `month` | int |
| `department_id` | int |
| `manager_id` | int |

---

### `GET /sales/orders`

Paginated order feed.

| Param | Type | Default | Notes |
|---|---|---|---|
| `year` | int | — | |
| `month` | int | — | |
| `department_id` | int | — | |
| `region_id` | int | — | |
| `status` | string | — | `completed` \| `pending` \| `cancelled` \| `returned` |
| `limit` | int | 50 | 1–200 |
| `offset` | int | 0 | |

---

### `GET /sales/top-products`

Top 10 products by revenue using `RANK` and `DENSE_RANK`.

| Param | Type |
|---|---|
| `year` | int |

---

### `GET /sales/top-per-category`

Top 3 products per category using `ROW_NUMBER PARTITION BY`.

| Param | Type |
|---|---|
| `year` | int |

---

### `GET /sales/insights`

Rule-based sales insights.  
**Roles:** admin, analyst, manager

---

## Managers

**Roles:** admin, analyst, manager

### `GET /managers`

Leaderboard ordered by team revenue.

| Param | Type |
|---|---|
| `year` | int |
| `month` | int |
| `department_id` | int |

---

### `GET /managers/{manager_id}/overview`

KPI summary for a single manager's team (headcount, revenue, avg achievement).

| Param | Type |
|---|---|
| `year` | int |

---

### `GET /managers/{manager_id}/team`

Per-employee sales vs target for a manager's team.

| Param | Type |
|---|---|
| `year` | int |
| `month` | int |

---

## Workforce

**Roles:** admin, analyst, manager

### `GET /workforce/summary`

Headcount KPIs: active count, exited count, headcount prev year, YoY growth.

| Param | Type |
|---|---|
| `department_id` | int |

---

### `GET /workforce/distribution`

Headcount grouped by department, job level, or manager.

| Param | Type | Notes |
|---|---|---|
| `by` | string | `department` \| `level` \| `manager` (default: `department`) |
| `department_id` | int | |

---

### `GET /workforce/headcount-trend`

Monthly new hires and exits.

| Param | Type |
|---|---|
| `department_id` | int |

---

### `GET /workforce/hierarchy`

Full org tree built from a recursive CTE. Returns a nested structure of manager → direct reports.

| Param | Type |
|---|---|
| `department_id` | int |

---

### `GET /workforce/insights`

Rule-based workforce insights (headcount growth, attrition, pay equity).  
**Roles:** admin, analyst, manager

---

## Salary

Salary endpoints have split access: aggregated views allow `analyst`; individual records (`top-earners`, `above-department-average`, `department-rank`) require `admin`.

### `GET /salary/summary`

Avg salary, total payroll, median salary.  
**Roles:** admin, analyst

| Param | Type |
|---|---|
| `department_id` | int |

---

### `GET /salary/by-department`

Avg salary and payroll share per department.  
**Roles:** admin, analyst

---

### `GET /salary/above-department-average`

Employees earning above their department's average (uses CTE).  
**Roles:** admin only

| Param | Type |
|---|---|
| `department_id` | int |

---

### `GET /salary/top-earners`

Top 10 earners across the company.  
**Roles:** admin only

| Param | Type |
|---|---|
| `department_id` | int |

---

### `GET /salary/bands`

Salary quartile distribution via `NTILE(4)`. Analysts receive distribution data without individual names or salary figures.  
**Roles:** admin, analyst

| Param | Type |
|---|---|
| `department_id` | int |

---

### `GET /salary/payroll-share`

Payroll as a percentage of total per department (window function without partition).  
**Roles:** admin, analyst

---

### `GET /salary/department-rank`

Salary rank within each department using `RANK PARTITION BY`.  
**Roles:** admin only

| Param | Type |
|---|---|
| `department_id` | int |

---

### `GET /salary/insights`

Rule-based salary insights (pay equity, payroll-to-revenue ratio).  
**Roles:** admin, analyst

---

## Inventory

**Roles:** admin, analyst, manager

### `GET /inventory/summary`

Total products, out-of-stock count, low-stock count, total stock value.

---

### `GET /inventory/by-category`

Stock value and product composition per category.

| Param | Type |
|---|---|
| `category_id` | int |

---

### `GET /inventory/alerts`

Products requiring attention, filterable by alert type.

| Param | Type | Notes |
|---|---|---|
| `alert_type` | string | `low_stock` \| `out_of_stock` \| `overstock` |
| `category_id` | int | |

---

### `GET /inventory/movement-analysis`

Velocity, turnover ratio, months-of-cover, and risk flags (`overstock` / `stockout` / `ok`).

| Param | Type |
|---|---|
| `category_id` | int |

---

### `GET /inventory/insights`

Rule-based inventory insights (out-of-stock criticals, dead stock, overstock).  
**Roles:** admin, analyst, manager

---

## Finance

**Roles:** admin, analyst only (managers and employees get 403)

### `GET /finance/summary`

Revenue, total expenses, gross profit, gross margin %, net profit.

| Param | Type |
|---|---|
| `year` | int |

---

### `GET /finance/revenue-vs-expenses`

Monthly revenue vs expenses vs profit trend.

| Param | Type |
|---|---|
| `year` | int |

---

### `GET /finance/department-costs`

Cost breakdown per department by expense category.

| Param | Type |
|---|---|
| `year` | int |

---

### `GET /finance/dept-pnl`

Department P&L built with `FULL OUTER JOIN` (revenue-generating departments joined with all cost centres).

| Param | Type |
|---|---|
| `year` | int |

---

### `GET /finance/insights`

Rule-based finance insights (gross margin warning, net profit, payroll-to-revenue ratio).  
**Roles:** admin, analyst

---

## HR

**Roles:** admin, analyst, manager

### `GET /hr/summary`

Hiring rate, attrition rate, avg tenure, new hires YTD, exits YTD.

---

### `GET /hr/hiring-trend`

New hires per month with cumulative headcount.

| Param | Type |
|---|---|
| `department_id` | int |

---

### `GET /hr/attrition`

Attrition rate and exit breakdown per department, sorted by rate descending.

| Param | Type |
|---|---|
| `department_id` | int |

---

### `GET /hr/tenure`

Tenure distribution with bucket classification (< 1 yr, 1–2 yr, 2–5 yr, 5+ yr).

| Param | Type |
|---|---|
| `department_id` | int |

---

### `GET /hr/insights`

Rule-based HR insights (attrition alerts, hires vs exits comparison).  
**Roles:** admin, analyst, manager

---

## Admin

**Roles:** admin only

### `POST /admin/refresh-materialized-views`

Runs `REFRESH MATERIALIZED VIEW mvw_daily_sales_summary`. Returns `{"refreshed": ["mvw_daily_sales_summary"]}`.

**Errors:** `403` for any non-admin role

---

## Insights shape

All `/insights` endpoints return an array of objects with this shape:

```json
[
  {
    "severity": "critical",
    "category": "inventory",
    "message": "8 products are completely out of stock.",
    "metric_value": "8"
  }
]
```

| Field | Values |
|---|---|
| `severity` | `critical` \| `warning` \| `positive` \| `neutral` |
| `category` | Domain string (e.g. `inventory`, `workforce`, `finance`) |
| `message` | Human-readable sentence |
| `metric_value` | Formatted number or percentage string |

The executive feed (`/executive/insights`) is capped at 6 items and sorted critical → warning → positive → neutral.

---

## Health check

`GET /health` — no authentication required.

```json
{ "status": "ok", "db": "ok" }
```

`db` is `"unreachable"` if the database connection fails.
