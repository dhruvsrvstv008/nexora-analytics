# Nexora Analytics — CLAUDE.md

## Project
Portfolio-grade Business Intelligence platform: FastAPI + PostgreSQL backend, React + Vite + Tailwind frontend, seeded with synthetic operational data across 10 analytics domains.

## Locked Stack
| Layer | Technology |
|---|---|
| Database | PostgreSQL 16 (docker-compose) |
| ORM / migrations | SQLAlchemy 2 + Alembic |
| API | FastAPI 0.111, uvicorn, python-jose JWT, passlib bcrypt |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS 3, Recharts, TanStack Query v5 |
| Testing | pytest 8.2 (in requirements.txt — no tests yet) |

## Working Directory
`/Users/Administrator/nexora-analytics/`

## Phase Status

| # | Phase | Status |
|---|---|---|
| 1 | Scaffold, models (10), Alembic migration, health endpoint | ✅ Complete (committed) |
| 2 | `generate_data.py` + `seed.py` (seasonal, attrition, inventory) | ✅ Complete (committed) |
| 3 | 37 analytics SQL files + service layer (CTEs, window fns, recursive, FULL OUTER JOIN) | ✅ Complete (committed) |
| 4 | 40 API endpoints across 10 routers, RBAC, insights engine skeleton | ✅ Complete (committed) |
| 5 | Vite+Tailwind shell, Executive dashboard, login, KPI cards, Recharts | ✅ Complete (committed) |
| 6 | Sales, Workforce, Inventory pages with URL-synced filter bars | ✅ Complete (committed) |
| 7 | Managers, Salary, Finance, HR, Hierarchy pages + recursive-CTE org tree | ✅ Complete (committed) |
| 8 | Insights engine — rules wired to per-module endpoints + insight panels on all pages | 🔄 In progress |
| 9 | Tests, docs (SQL_SHOWCASE.md, ERD.md, README), polish pass | ⏳ Pending |

## Phase 8 — Insights Engine Wiring Tasks

The 12 new rules in `rules.py` are committed. The SQL data layer is complete — every
key the rules read IS returned by the corresponding SQL file. The outstanding work is
at the **route level**: no per-module insight endpoints exist yet.

### Wiring tasks (must be done in Phase 8)

| Composer | Route to create | Services needed |
|---|---|---|
| `generate_sales_insights` | `GET /sales/insights` | `sales_service.get_monthly_trend`, `.get_by_department`, `.get_targets` |
| `generate_inventory_insights` | `GET /inventory/insights` | `inventory_service.get_summary`, `.get_velocity` |
| `generate_workforce_insights` | `GET /workforce/insights` | `workforce_service.get_summary`, `.get_salary_by_department`; `hr_service.get_attrition` |
| `generate_finance_insights` | `GET /finance/insights` | `finance_service.get_summary` (payroll = `total_expenses`, revenue = `revenue`) |
| `generate_hr_insights` | `GET /hr/insights` | `hr_service.get_summary`, `.get_attrition` |

### Key availability audit (confirmed 2026-08-18)

All 12 new rules were audited against the current SQL output. No SQL-level key is
missing. Confirmed present:

- `rule_headcount_growth` reads `headcount_prev_year` — returned by `workforce/summary.sql`
  via `prev_year` CTE. Key exists; rule is safe once the `/workforce/insights` route is wired.
- `rule_hires_vs_exits` reads `new_hires_ytd`, `exits_ytd` — returned by `hr/summary.sql`.
- `rule_manager_performance` reads `achievement_pct`, `manager_name`, `full_name` — returned
  by `sales/target_vs_actual.sql`. ✅
- `rule_aov_change` reads `revenue`, `order_count` — returned by `sales/monthly_trend.sql`. ✅
- `rule_overstock_stockout` reads `risk_flag` — returned by `inventory/velocity.sql`. ✅
- `rule_dead_stock` reads `velocity_label`, `avg_monthly_outbound` — returned by `inventory/velocity.sql`. ✅
- `rule_attrition` reads `attrition_rate_pct`, `department_name` — returned by `hr/attrition.sql`. ✅
- `rule_high_salary_dept` reads `department_name`, `avg_salary` — returned by `workforce/salary_by_department.sql`. ✅
- `rule_profit_margin` reads `gross_margin_pct` — returned by `finance/summary.sql`. ✅
- `rule_net_profit` reads `net_profit`, `revenue` — returned by `finance/summary.sql`. ✅
- `rule_payroll_vs_revenue` takes plain floats (no key lookup). ✅

### Frontend tasks (Phase 8)

- Add an `InsightPanel` component (severity icon + message + metric chip)
- Wire it into: Executive (already has insight endpoint), Sales, Inventory, Workforce, Finance, HR pages
- Each page calls its own `GET /<domain>/insights` endpoint via a useQuery hook

## Decisions That Must Not Be Undone
- Currency is **INR** (Indian Rupees) — `formatINR` used throughout frontend
- RBAC roles: `admin`, `manager`, `analyst` — all three can read; only `admin` can refresh materialized views
- JWT access tokens expire in 60 min; refresh tokens in 7 days
- SQL lives in `backend/app/sql/<domain>/` flat files, loaded by service layer — do NOT inline SQL into routes or services
- Org hierarchy uses a **recursive CTE** in `workforce/hierarchy.sql` — do not replace with application-side recursion
- Frontend state management is **TanStack Query only** — no Redux, no Zustand, no Context for server state
- All filters sync to **URL query params** via `useFilters` hook — do not break this pattern

## Known Gaps (as of 2026-08-18)
- `backend/tests/` exists but contains only an empty `__init__.py` — **zero tests written** (Phase 9)
- `docs/` directory exists but is **empty** (Phase 9 — ERD.md, SQL_SHOWCASE.md)
- `docker-compose.yml` only runs postgres + pgadmin — backend and frontend are **not containerised**
- No `README.md` exists at repo root (Phase 9)
- No per-module insights endpoints exist yet (Phase 8 — see wiring table above)
