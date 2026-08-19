# Claude Code Master Prompt — Nexora Analytics

> Paste this whole file as your first message in Claude Code (or save it as `PROJECT_BRIEF.md` in an empty folder and tell Claude Code: "Read PROJECT_BRIEF.md and follow it").

---

## 0. Your role

You are the lead engineer building a portfolio-grade analytics platform. I am a final-year CS student positioning myself as a **Data Analyst who can also ship Python applications**. This project has to survive an interview where someone opens the repo, reads the SQL, and asks "why did you do it this way?"

Optimize for:
1. **SQL depth** — the queries are the centrepiece, not an afterthought
2. **Clean layered architecture** — Postgres → SQL/SQLAlchemy → FastAPI services → JSON → React
3. **Realistic data** — dashboards must look alive, not like a demo with 12 rows
4. **Readable code** — an interviewer will read it, not just run it

Do **not** build everything in one shot. Follow the phase plan in section 13 and stop at every checkpoint.

---

## 1. Project identity

**Name:** Nexora Analytics
**Full title:** Nexora Analytics — Business Intelligence & Operations Analytics Platform

**One-line positioning (use this in README, package.json description, page title):**
> A business intelligence platform built with Python that transforms operational data into interactive dashboards for sales, inventory, workforce, financial, HR and management analysis.

**Core principle:** This is an *analytics* product, not a CRUD product. We are not managing inventory — we are analyzing it. We are not an HRMS — we are analyzing workforce data. Every screen should answer a business question, not just list rows.

---

## 2. Locked tech stack

Do not substitute anything here without asking me first.

| Layer | Choice |
|---|---|
| Database | PostgreSQL 16 |
| ORM / query layer | SQLAlchemy 2.x (Core + ORM), raw SQL for all analytics |
| Backend | Python 3.11 + FastAPI |
| Validation | Pydantic v2 |
| Auth | JWT (access + refresh), passlib/bcrypt |
| Migrations | Alembic |
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Data fetching | TanStack Query (React Query) + Axios |
| Routing | React Router v6 |
| Testing | Pytest + httpx (backend), Vitest + RTL (frontend, light) |
| Local infra | Docker Compose (postgres + pgadmin only) |
| VCS | Git, conventional commits |

**Hard rule:** React never computes analytics. No `.reduce()` to calculate revenue. The API returns final numbers; React renders them. If you catch yourself doing math in a component, move it to a SQL query.

---

## 3. Repository structure

```
nexora-analytics/
├── docker-compose.yml
├── README.md
├── .env.example
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── dependencies.py          # get_db, get_current_user, require_role
│   │   ├── models/                  # SQLAlchemy models
│   │   ├── schemas/                 # Pydantic response/request models
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── executive.py
│   │   │   ├── sales.py
│   │   │   ├── workforce.py
│   │   │   ├── salary.py
│   │   │   ├── inventory.py
│   │   │   ├── finance.py
│   │   │   ├── hr.py
│   │   │   ├── managers.py
│   │   │   └── insights.py
│   │   ├── services/                # business logic, calls sql/
│   │   ├── sql/                     # ⭐ raw .sql files, one per analytic
│   │   │   ├── sales/
│   │   │   ├── workforce/
│   │   │   ├── inventory/
│   │   │   ├── finance/
│   │   │   └── hr/
│   │   ├── insights/                # rule-based insight generators
│   │   └── utils/
│   ├── alembic/
│   ├── seed/
│   │   ├── generate_data.py
│   │   └── seed.py
│   ├── tests/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/                     # axios client + typed endpoint fns
│   │   ├── hooks/                   # useQuery wrappers
│   │   ├── layouts/                 # AppShell, Sidebar, Topbar
│   │   ├── components/
│   │   │   ├── ui/                  # Card, Button, Select, Badge, Table
│   │   │   ├── charts/              # AreaChart, BarChart, DonutChart, Sparkline
│   │   │   └── kpi/                 # KpiCard, KpiRow
│   │   ├── pages/
│   │   ├── types/
│   │   └── lib/                     # formatters (₹ lakh/crore, %, dates)
│   └── package.json
│
└── docs/
    ├── ERD.md
    ├── SQL_SHOWCASE.md              # ⭐ best 15 queries, explained
    └── API.md
```

**`app/sql/` is a deliberate architectural choice.** Analytics queries live in versioned `.sql` files loaded at runtime, not as f-strings buried in Python. This makes the SQL reviewable on its own — which is the point of the project. Use named bind parameters (`:year`, `:department_id`), never string interpolation.

---

## 4. Database schema

PostgreSQL. Write proper DDL via Alembic migrations. Add indexes, FKs, CHECK constraints, and comments on every table.

### Tables

**departments**
`department_id PK, name, cost_center_code, created_at`

**employees** — self-referencing hierarchy
```
employee_id      PK
full_name
email            UNIQUE
department_id    FK → departments
manager_id       FK → employees.employee_id   -- ⭐ self-reference, nullable
job_title
job_level        -- executive / manager / senior / associate
salary           NUMERIC(12,2)
hire_date        DATE
exit_date        DATE NULL
status           -- active / resigned / terminated
```

**users** — auth is separate from HR data
`user_id PK, employee_id FK → employees (nullable), email UNIQUE, password_hash, role (admin|manager|analyst|employee), is_active, last_login_at`

**categories**
`category_id PK, name, parent_category_id FK → categories NULL`

**products**
`product_id PK, sku UNIQUE, name, category_id FK, unit_cost, unit_price, reorder_level, is_active`

**inventory**
`inventory_id PK, product_id FK UNIQUE, quantity_on_hand, warehouse_location, last_restocked_at, updated_at`

**stock_movements** — powers turnover / aging / fast-vs-slow moving
`movement_id PK, product_id FK, movement_type (inbound|outbound|adjustment), quantity, movement_date, reference_id`

**regions**
`region_id PK, name, zone` (North / South / East / West)

**sales**
`sale_id PK, order_number UNIQUE, employee_id FK, region_id FK, customer_name, order_date, status (completed|pending|cancelled|returned), payment_method, subtotal, discount, total_amount`

**sale_items**
`sale_item_id PK, sale_id FK, product_id FK, quantity, unit_price, unit_cost, line_total`
→ profit is derived: `(unit_price - unit_cost) * quantity`

**targets**
`target_id PK, employee_id FK NULL, department_id FK NULL, period_month DATE, target_amount`
→ supports both individual and department targets

**expenses**
`expense_id PK, department_id FK, expense_category (payroll|operations|marketing|infrastructure|misc), amount, expense_date, description`

### Required database objects
- Indexes on every FK, plus `sales(order_date)`, `sale_items(product_id)`, `employees(department_id, manager_id)`, `stock_movements(product_id, movement_date)`
- **At least 3 views**: `vw_monthly_revenue`, `vw_employee_performance`, `vw_inventory_health`
- **1 materialized view**: `mvw_daily_sales_summary` with a refresh endpoint (admin-only) — talk about why in the README
- A `CHECK` constraint proving you know they exist (e.g. `salary > 0`, `quantity >= 0`)

---

## 5. Seed data

Write `seed/generate_data.py` using Faker + numpy. Data quality matters more than volume — the charts must tell a story.

Targets:
- **8 departments**, **~190 employees** across a 3-level hierarchy (1 exec → ~14 managers → the rest), realistic Indian names and salary bands per department (IT highest ~₹78k avg, Operations ~₹45k)
- **~450 products** across **10 categories**
- **~24 months of sales** (Sep 2024 → Aug 2026), roughly 15,000 orders, 40,000 sale_items
- Monthly targets for every sales employee and department

Inject deliberate, discoverable patterns:
- Overall upward revenue trend with **seasonal spikes in Oct–Nov (festive)** and a dip in Feb
- 2–3 managers who consistently overachieve (110%+) and 1–2 who underperform (~85%)
- ~25 products below reorder level, ~8 out of stock
- 3–4 clear **overstock** cases (high stock, near-zero monthly sales) and 3–4 **stockout-risk** cases (low stock, high velocity)
- Attrition clustered in one department so HR analytics shows something real
- Headcount growth: ~120 (2024) → ~158 (2025) → ~190 (2026)

Make the seed **idempotent and deterministic** (`random.seed(42)`) so results are reproducible.

---

## 6. SQL analytics layer — the centrepiece

Every metric below must be computed by a query in `app/sql/`. The project must naturally demonstrate this progression:

`JOIN → GROUP BY → HAVING → subqueries → correlated subqueries → CTEs → window functions → CASE → views → indexes → transactions`

### Must-have query set

**Sales**
- Revenue, profit, orders, AOV (single aggregate query)
- Monthly revenue + profit with **MoM growth using `LAG()`**
- Running/cumulative revenue with `SUM() OVER (ORDER BY month)`
- Sales by department / employee / manager / product / category / region
- Target vs actual with achievement % and `CASE` bucketing (Exceeded / Met / Missed)
- Top 10 products by revenue using `RANK()` and `DENSE_RANK()`
- Top 3 products **per category** using `ROW_NUMBER() OVER (PARTITION BY category)`

**Workforce & salary**
- Employees earning above their **department average** — write it twice: correlated subquery version *and* CTE version, keep both in `docs/SQL_SHOWCASE.md` and compare
- `RANK() OVER (PARTITION BY department_id ORDER BY salary DESC)`
- Salary percentile bands with `NTILE(4)`
- Payroll share per department (`amount / SUM(amount) OVER ()`)
- **Recursive CTE** to walk the `manager_id` hierarchy and return each employee's reporting chain depth ⭐ this is your interview showpiece
- Headcount growth, tenure buckets, new hires by month, attrition rate

**Inventory**
- Inventory value by category
- Low stock / out of stock / overstock detection
- Stock turnover ratio (outbound movements ÷ avg stock)
- Fast vs slow moving classification with `CASE` + `NTILE`
- **Stock vs sales velocity** → months-of-cover, flagging both overstock and stockout risk

**Finance**
- Revenue vs expenses vs profit by month
- Profit margin %
- Cost per employee, payroll as % of revenue
- Department P&L using a `FULL OUTER JOIN` between revenue and expense CTEs

Document your **best 15 queries** in `docs/SQL_SHOWCASE.md` — each with the business question, the query, and 2–3 lines on why it's written that way. This file is what I'll open in an interview.

---

## 7. API surface

All under `/api/v1`. All list endpoints support `year`, `month`, `department_id`, `manager_id`, `category_id`, `region_id` as optional query params where sensible.

```
POST   /auth/login                 → access + refresh token
POST   /auth/refresh
GET    /auth/me

GET    /executive/overview         → KPI cards + trends + alerts, single payload
GET    /executive/insights

GET    /sales/summary
GET    /sales/trend                → monthly revenue, profit, growth %
GET    /sales/by-dimension?dim=department|employee|manager|product|category|region
GET    /sales/targets
GET    /sales/orders               → paginated table feed

GET    /managers                   → manager leaderboard
GET    /managers/{id}/overview     → team KPIs
GET    /managers/{id}/team         → per-employee sales vs target

GET    /workforce/summary
GET    /workforce/distribution?by=department|role|manager|tenure
GET    /workforce/headcount-trend
GET    /workforce/hierarchy        → recursive CTE output, tree shaped

GET    /salary/summary
GET    /salary/by-department
GET    /salary/above-department-average
GET    /salary/top-earners
GET    /salary/bands

GET    /inventory/summary
GET    /inventory/by-category
GET    /inventory/alerts           → low stock, out of stock, overstock
GET    /inventory/movement-analysis → fast/slow, turnover, months of cover

GET    /finance/summary
GET    /finance/revenue-vs-expenses
GET    /finance/department-costs

GET    /hr/summary
GET    /hr/hiring-trend
GET    /hr/attrition
GET    /hr/tenure

POST   /admin/refresh-materialized-views   (admin only)
```

Response conventions:
- Money as **integer paise/rupees**, never pre-formatted strings — frontend formats
- Every trend endpoint returns `[{ period, value, ... }]` sorted ascending
- Every summary endpoint returns `{ value, previous_value, change_pct, direction }` per KPI so the frontend can render deltas without extra calls
- Consistent error envelope: `{ detail, code }`

---

## 8. Auth & role-based access

Roles: `admin`, `manager`, `analyst`, `employee`.

| Role | Access |
|---|---|
| admin | Everything, including salaries and finance |
| manager | Own team only — team sales, team employees, team targets. `manager_id` scoping enforced **in SQL**, not just in the UI |
| analyst | All analytics, but salary fields masked and no individual PII |
| employee | Own record + own targets only |

Enforce with a `require_role(...)` FastAPI dependency **and** by injecting a scope filter into queries. Write a test proving a manager calling `/salary/top-earners` gets 403, and that a manager calling `/sales/by-dimension?dim=employee` only sees their own team. Sidebar in React hides what the role can't reach — but the backend is the real gate.

Seed 4 demo users (one per role) and document the credentials in the README.

---

## 9. Insights engine

`app/insights/` — **rule-based Python, no AI/LLM**. Each rule is a small function that takes computed metrics and returns `{ severity, category, message, metric_value }`. Compose them into `/executive/insights` and per-module insight blocks.

Starter rules:
- Revenue changed by more than ±5% MoM
- Highest-contributing department this month
- Count of products below reorder level
- Any manager above 110% or below 85% of target
- Department with highest average salary
- Payroll exceeding X% of revenue
- Products flagged overstock or stockout-risk
- Attrition above threshold in any department

Sort by severity (`critical | warning | positive | neutral`) and cap the executive feed at 6. In the README, explicitly note that these are deterministic rules by design — the value is the analysis, not a buzzword.

---

## 10. Frontend design direction

Two reference dashboards are attached (`Cartly`, `FluxCart`). Match their **layout, density and component vocabulary** — not their exact colours.

### App shell
- **Fixed left sidebar, 248px**, dark slate (`#0F172A`), collapsible to 64px icon rail
- Sidebar: logo block "Nexora" at top → grouped nav with section labels (MAIN / ANALYTICS / ADMIN) → expandable sub-items with chevrons → user profile card pinned at bottom with avatar, name, email
- Active nav item: filled pill in accent colour, subtle left indicator
- **Topbar**: page title left, global search input (pill, icon inside), date-range selector, refresh icon, notifications, primary action button on the right
- Content area background `#F8FAFC`, cards pure white, `rounded-xl`, `border border-slate-200`, very soft shadow, `p-5`

### Tokens
```
primary      #4F46E5   (indigo)
positive     #16A34A
negative     #E11D48
warning      #F59E0B
surface      #FFFFFF
bg           #F8FAFC
border       #E2E8F0
text         #0F172A
muted        #64748B
radius       12px cards / 8px controls
font         Inter (or system stack)
```

### Component vocabulary (directly from the screenshots)
1. **KpiCard** — label + optional info icon top row, big value, delta row underneath (`↑ 12.4% from last month`, coloured green/red), optional inline sparkline on the right. Always rendered as a **4-across responsive grid**.
2. **Area/line chart card** — title left, legend as coloured dots, period dropdown top-right (`This Year ▾`), gradient fill under the line, hover tooltip as a dark rounded pill showing the value.
3. **Donut card** — thick ring, big centred figure, legend below with coloured squares + label + right-aligned percentage.
4. **Ranked list card** — numbered rows (01, 02, 03), icon/avatar, name, sub-line metric, "Details" pill button on the right.
5. **Data table** — checkbox column, sortable headers with sort icons, avatar + name cells, right-aligned money, **status pills** (soft background + strong text: green success, amber pending, blue shipped, rose cancelled), search + filter controls in the card header, `Items per page` + pager in the footer.
6. **Right rail feed** — compact list with coloured icon chips, title, timestamp, right-aligned amount.

### Behaviour
- Skeleton loaders for every card (no spinners)
- Empty states with a one-line explanation
- Filters live in the URL query string so dashboard views are shareable
- Indian number formatting throughout: `₹24.8 L`, `₹1.02 Cr`, `4,821` — write it once in `lib/format.ts`
- Responsive: 4 → 2 → 1 column KPI grid; sidebar becomes a drawer under 1024px
- Charts must handle a real 24-month series without becoming unreadable

---

## 11. Pages

| Route | Content |
|---|---|
| `/login` | Split screen — brand panel left, form right. Demo credential hints. |
| `/` Executive | 4 KPI cards (Revenue, Profit, Employees, Inventory Value) → revenue+profit trend area chart (2/3) + sales-by-department donut (1/3) → insights panel + inventory alerts → top managers ranked list → recent orders table. Understandable in 30 seconds. |
| `/sales` | Filter bar (Year / Month / Department / Manager / Category / Region) → 4 KPIs → monthly revenue vs profit chart → target vs actual grouped bars → by-dimension tabbed breakdown → orders table |
| `/managers` | Manager leaderboard table → click through to `/managers/:id` with team KPIs and the per-employee sales vs target vs achievement table |
| `/workforce` | Headcount KPIs → employees by department bar → by job role donut → salary distribution histogram → headcount growth line → tenure buckets → employee table |
| `/salary` | Avg salary, monthly payroll, highest-paid department KPIs → avg salary by department bar → payroll share donut → salary bands → **above-department-average** table → top 10 earners |
| `/inventory` | Product/units/value/low-stock/out-of-stock KPIs → value by category → alerts split into three tabs (Low / Out / Overstock) → fast vs slow moving → **stock vs sales velocity table with risk flags** |
| `/finance` | Revenue / expenses / profit / margin KPIs → revenue vs expenses combo chart → monthly profit trend → department cost breakdown |
| `/hr` | Hiring trend, attrition rate, avg tenure KPIs → employee growth by year → new hires vs exits → department table with headcount and avg salary |
| `/hierarchy` | Org tree rendered from the recursive CTE — expandable nodes, headcount per branch |

---

## 12. Testing & docs

- Pytest: auth flow, RBAC (403 cases), each analytics service returns correctly shaped data, at least 5 tests asserting **known numbers** from the deterministic seed
- A conftest fixture spinning up a test database with a small seeded slice
- `docs/ERD.md` with a Mermaid ER diagram
- `docs/SQL_SHOWCASE.md` — the 15 queries, explained
- `README.md`: positioning line, architecture diagram, screenshots section, setup in under 5 commands, demo credentials, "what this demonstrates" bullets aimed at a recruiter

---

## 13. Build order — stop at every checkpoint

Work phase by phase. At the end of each, show me what you built and **wait for my go-ahead**.

**Phase 1 — Foundation**
Repo scaffold, docker-compose (postgres + pgadmin), FastAPI boots, SQLAlchemy models, Alembic initial migration, health endpoint.
→ Checkpoint: `docker compose up` + `alembic upgrade head` works, tables exist.

**Phase 2 — Data**
`generate_data.py` + `seed.py` with all the patterns from section 5. Print a summary table of what was generated.
→ Checkpoint: I can run analytics queries in pgadmin and see believable numbers.

**Phase 3 — SQL layer**
All `.sql` files in `app/sql/`, the loader utility, and the service functions that execute them. Backend only.
→ Checkpoint: walk me through 5 of your best queries before writing any routes.

**Phase 4 — Auth + core API**
JWT, RBAC dependency, and routes for executive / sales / workforce / inventory. Swagger docs clean.
→ Checkpoint: I test the endpoints in `/docs`.

**Phase 5 — Frontend shell + Executive dashboard**
Vite + Tailwind + router, AppShell with sidebar and topbar, the full `ui/` and `charts/` component library, login page, Executive dashboard wired to live data.
→ Checkpoint: this is the screenshot-worthy moment. Get the polish right here.

**Phase 6 — Sales, Workforce, Inventory pages**
Including the filter bar with URL state.

**Phase 7 — Manager, Salary, Finance, HR, Hierarchy**
Plus the recursive-CTE org tree.

**Phase 8 — Insights engine**
Rules, endpoints, and the insight panel component across dashboards.

**Phase 9 — Tests, docs, polish**
Pytest suite, `SQL_SHOWCASE.md`, ERD, README, seed reset script, loading/empty/error states audit.

---

## 14. Rules of engagement

- **Ask before assuming.** If a schema or product decision is ambiguous, ask one focused question rather than guessing and building the wrong thing.
- **No placeholder data in the frontend.** Every number renders from the API. If an endpoint isn't ready, build the endpoint.
- **No dead code, no commented-out blocks, no TODO stubs** left behind at a checkpoint.
- **Conventional commits**, one commit per meaningful unit: `feat(sales): add target vs actual analytics endpoint`
- **Explain your SQL.** When you write a window function or CTE, drop a 2-line comment above it saying what business question it answers.
- Keep `requirements.txt` and `package.json` minimal — every dependency should earn its place.
- If you propose deviating from this brief because you see a better approach, say so explicitly and wait for my answer.

---

## 15. Definition of done

- `docker compose up` → `alembic upgrade head` → `python -m seed.seed` → `uvicorn app.main:app` → `npm run dev` and the whole thing works from a clean clone
- All 10 pages render real data with working filters and role-based visibility
- 40+ analytics queries live in `app/sql/`, none of them string-interpolated
- Recursive CTE, window functions, materialized view and views all present and documented
- Pytest suite green
- README a recruiter can skim in 90 seconds and understand the scope

Start with Phase 1. Confirm your understanding in 5 bullets first, ask me anything unclear, then begin.
