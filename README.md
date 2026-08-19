# Nexora Analytics

> A business intelligence platform built with Python that transforms operational data into interactive dashboards for sales, inventory, workforce, financial, HR and management analysis.

---

## What this demonstrates

This is a portfolio project positioning me as a **data analyst who can also ship Python applications**. It is not a tutorial or a starter template — every layer was built from scratch and is designed to survive an interview where someone opens the code and asks "why did you do it this way?"

- **SQL depth** — 40+ analytics queries in versioned `.sql` files: window functions (`LAG`, `RANK`, `DENSE_RANK`, `NTILE`, `ROW_NUMBER`, `SUM OVER`), recursive CTEs for org hierarchy, correlated subqueries, `FULL OUTER JOIN` P&L, materialized views, `FILTER` aggregates. The SQL is the centrepiece, not an afterthought.
- **Layered architecture** — PostgreSQL → raw SQL files → service layer → FastAPI routes → JSON → React. Each layer has one job; none leaks into the next.
- **Realistic data** — 182 employees, 450 products, 15,173 orders across 24 months (Sep 2024 – Aug 2026). Deliberate patterns: seasonal festive spikes, clustered attrition in Customer Support, 3 overachieving managers and 1 underperformer, overstock vs stockout split.
- **Rule-based insights engine** — 14 deterministic Python rules that read pre-computed SQL metrics and emit prioritised, severity-tagged observations. No AI, no LLM — the value is in the analysis, not a buzzword.
- **RBAC enforced in SQL** — role restrictions are not just hidden in the UI. A manager calling `/salary/top-earners` gets 403. A manager calling `/sales` gets scoped to their own team in the query layer.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  React 18 + Vite + TypeScript + Tailwind CSS + Recharts         │
│  TanStack Query v5 · React Router v6 · Axios                   │
│                                                                  │
│  Pages: Executive · Sales · Managers · Workforce · Salary       │
│         Inventory · Finance · HR · Hierarchy                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP JSON (Axios)
┌──────────────────────────▼──────────────────────────────────────┐
│  FastAPI 0.111  ·  Uvicorn  ·  Pydantic v2                      │
│                                                                  │
│  Routes: /auth  /executive  /sales  /managers  /workforce        │
│          /salary  /inventory  /finance  /hr  /admin              │
│                                                                  │
│  Insights engine: 14 rules → 6 domain composers                  │
│  RBAC: require_role() dependency + SQL-level manager scoping     │
│  Auth: JWT access (60 min) + refresh (7 days) via passlib/bcrypt │
└──────────────────────────┬──────────────────────────────────────┘
                           │ SQLAlchemy 2 + raw SQL files
┌──────────────────────────▼──────────────────────────────────────┐
│  PostgreSQL 16                                                   │
│                                                                  │
│  12 tables · 3 views · 1 materialized view                       │
│  40+ analytics SQL files in app/sql/<domain>/                    │
│  Indexes on every FK · CHECK constraints · table comments        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Setup (5 commands)

**Prerequisites:** PostgreSQL 16 running on `localhost:5432`, Python 3.11, Node 20.

```bash
# 1 — clone and install backend
git clone https://github.com/deepakjangir/nexora-analytics.git
cd nexora-analytics/backend
pip install -r requirements.txt

# 2 — configure environment
cp ../.env.example .env        # edit DATABASE_URL if your PG credentials differ

# 3 — run migrations and seed
python -m alembic upgrade head
python -m seed.seed

# 4 — start backend  (another terminal)
uvicorn app.main:app --reload  # http://localhost:8000/docs

# 5 — start frontend  (another terminal)
cd ../frontend && npm install && npm run dev   # http://localhost:5173
```

> Docker Compose (`docker-compose.yml`) starts a PostgreSQL + pgAdmin stack if you prefer not to install Postgres natively: `docker compose up -d postgres`

---

## Demo credentials

| Role | Email | Password | Access |
|---|---|---|---|
| Admin | admin@nexora.dev | Admin@123 | Everything, including salary and finance |
| Analyst | analyst@nexora.dev | Analyst@123 | All analytics; salary data aggregated only |
| Manager | manager@nexora.dev | Manager@123 | Own team only — scoped in SQL |
| Employee | employee@nexora.dev | Employee@123 | Own record and targets only |

---

## Pages

| Route | What it shows |
|---|---|
| `/` | Executive dashboard — 4 KPIs, revenue trend, top managers, recent orders, insights, inventory alerts |
| `/sales` | Filter bar · revenue vs profit trend · target vs actual · 6 breakdown dimensions · orders table |
| `/managers` | Leaderboard → `/managers/:id` with team KPIs and per-employee target achievement |
| `/workforce` | Headcount · department distribution · salary histogram · headcount growth trend · tenure buckets |
| `/salary` | Avg salary · payroll share donut · salary bands · above-dept-average table · top earners |
| `/inventory` | Stock alerts (Low / OOS / Overstock tabs) · value by category · velocity with months-of-cover |
| `/finance` | Revenue vs expenses combo chart · monthly profit trend · department P&L |
| `/hr` | Hiring trend · attrition by department · tenure distribution |
| `/hierarchy` | Org tree from recursive CTE — expandable nodes with headcount per branch |

---

## Running tests

```bash
cd backend
python -m pytest tests/ -v
```

53 tests across 4 files: auth flow, RBAC (403 cases), analytics assertions against known seed numbers, and insights engine shape + data validation.

---

## Key SQL techniques

| Technique | Where |
|---|---|
| `LAG()` for MoM growth | `sales/monthly_trend.sql` |
| `SUM() OVER` cumulative revenue | `sales/monthly_trend.sql` |
| `RANK()` and `DENSE_RANK()` | `sales/top_products.sql` |
| `ROW_NUMBER() PARTITION BY` | `sales/top_per_category.sql` |
| `NTILE(4)` quartile bands | `workforce/salary_percentile_bands.sql` |
| Window aggregate — no partition | `workforce/payroll_share.sql` |
| CTE vs correlated subquery comparison | `workforce/above_dept_avg_*.sql` |
| `RANK() PARTITION BY` salary rank | `workforce/salary_department_rank.sql` |
| Recursive CTE org tree | `workforce/hierarchy.sql` |
| `FULL OUTER JOIN` department P&L | `finance/dept_pnl.sql` |
| Months-of-cover + `NTILE` velocity | `inventory/velocity.sql` |
| `FILTER (WHERE ...)` aggregate | `workforce/summary.sql` |
| Materialized view + refresh endpoint | `mvw_daily_sales_summary` + `/admin` |

Full explanations with business context for the 15 most illustrative queries: **[docs/SQL_SHOWCASE.md](docs/SQL_SHOWCASE.md)**  
Entity-relationship diagram: **[docs/ERD.md](docs/ERD.md)**

---

## Project structure

```
nexora-analytics/
├── backend/
│   ├── app/
│   │   ├── insights/        # rule-based insight engine (no AI)
│   │   ├── models/          # 12 SQLAlchemy models
│   │   ├── routes/          # 10 FastAPI routers
│   │   ├── schemas/         # Pydantic request/response models
│   │   ├── services/        # business logic, calls sql/
│   │   ├── sql/             # 40+ raw .sql files by domain
│   │   └── utils/           # JWT, security helpers
│   ├── alembic/             # migrations
│   ├── seed/                # deterministic data generator (random.seed(42))
│   └── tests/               # 53 pytest tests
├── frontend/
│   └── src/
│       ├── api/             # typed Axios wrappers per domain
│       ├── components/      # ui/, charts/, kpi/
│       ├── hooks/           # TanStack Query hooks per domain
│       ├── layouts/         # AppShell, Sidebar, Topbar
│       ├── lib/             # formatINR, formatPct, cn utilities
│       └── pages/           # 10 page components
└── docs/
    ├── ERD.md               # Mermaid entity-relationship diagram
    └── SQL_SHOWCASE.md      # 15 queries with business context
```

---

*Built by Deepak Jangir · deepakjangir0702@gmail.com*
