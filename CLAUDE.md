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
| 8 | Insights engine — rules wired to per-module endpoints + insight panels on all pages | ✅ Complete (committed) |
| 9 | Tests, docs (SQL_SHOWCASE.md, ERD.md, README), polish pass | ✅ Complete (committed) |

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

## Known Gaps
- `docker-compose.yml` only runs postgres + pgadmin — backend and frontend are **not containerised**
- bcrypt must stay at 4.0.1 — bcrypt 5.x breaks passlib's `__about__` introspection; pin in requirements.txt
- `docs/API.md` was never written (ERD.md and SQL_SHOWCASE.md exist; API.md does not)

---

## DEPLOYMENT STATUS (as of 2026-08-20)

### What is actually complete

| Phase | Status | Notes |
|---|---|---|
| 8 — Insights engine | ✅ Done | 14 rules, 7 `/insights` endpoints, `InsightPanel` on all pages |
| 9 — Tests, docs, polish | ✅ Done | 53 pytest tests passing, `SQL_SHOWCASE.md` (15 queries), `ERD.md`, `README.md` |
| Two SQL bugs fixed | ✅ Done | `hierarchy.sql` (::TEXT cast across UNION ALL); `salary_percentile_bands.sql` (nested window fn → CTE) |
| Deployment config | ✅ Done | `netlify.toml`, `render.yaml` (fallback), `DEPLOYMENT.md`, `ColdStartBanner`, skeleton audit |

**`docs/API.md` was never written.** Everything else the brief specified is done.

### Seed data — verified numbers (local, deterministic)

No "fixes" to revenue, margin, or manager count were applied in this session — these are the baseline numbers produced by `seed.py` with `random.seed(42)`. Verified by live query and by 53 passing tests.

| Metric | Value |
|---|---|
| Active employees | 182 |
| Headcount prev year | 155 → 17.4% YoY growth |
| Sales orders (completed) | 11,852 of 15,173 total |
| Total revenue (completed) | ₹3,106.02 Cr (₹31.06 billion) |
| Gross margin | 6.85% |
| Managers (leaderboard) | 4 (Jhanvi Chaudhary #1 at ₹912 Cr) |
| Customer Support attrition | 32.14% (highest — deliberate seed pattern) |
| Products | 450 total; 8 out of stock; 21 low stock |
| Database size (local) | 19 MB (3.8% of Supabase 500 MB free tier) |

### Deployment target

**Railway** (backend) + **Netlify** (frontend) + **Supabase** (PostgreSQL).

Render was abandoned mid-session after Nixpacks silently selected Python 3.14, which has no pydantic-core wheel and fails building from source. `render.yaml` remains in the repo as a documented fallback; do not delete it.

### Railway config files added

Three files in `backend/` make the Nixpacks build deterministic:

| File | Purpose |
|---|---|
| `backend/.python-version` | `3.11.9` — was already present; Nixpacks reads this |
| `backend/nixpacks.toml` | `[phases.setup] nixPkgs = ["python311"]` — explicit provider override, takes precedence over detection |
| `backend/Procfile` | `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1` |

**There is no `railway.json`.** The backend root is communicated to Railway via the CLI flag `railway up ./backend --path-as-root`, not a config file. A fresh session that runs plain `railway up` from the repo root will deploy the wrong directory and fail silently — always use `--path-as-root ./backend`.

### Railway project state (mid-deploy when context ran out)

| Item | State |
|---|---|
| Old projects (`pleasing-stillness`, `valiant-luck`) | **Deleted** via GraphQL API — confirmed `projectDelete: true` |
| Fresh project | **Created** — `nexora-analytics` (ID: `33372b54-8b4b-4cdc-b27e-fb8cb24e1baf`) |
| Environment | `production` (ID: `630bb9a1-ba83-442b-8a09-f4ab02eec0f0`) |
| Service | **Created** — `nexora-analytics-api` (ID: `7a1ba514-e460-46b2-af61-b9e01c166e24`) |
| Env vars | **All set** (see table below) |
| Deploy | **Triggered** (ID: `84b2bd85-0d87-454d-8c06-a11119c9dc83`) — was in "scheduling build on Metal builder" state when context ran out |
| Python version | **NOT empirically verified** — build logs were not captured before context ended |
| Public domain | **NOT generated** — `railway domain` was never run |
| `/health` endpoint | **NOT tested** against Railway URL |

### Railway env vars currently set

| Variable | Value / Status |
|---|---|
| `DATABASE_URL` | `postgresql+psycopg2://postgres.gxlkkbyknqbreqxuzwhu:R%3FAk.SxT_P89t6x@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require` |
| `SECRET_KEY` | `f6cd0493fdfc6075b927d8082e1e324a77e7c7beb082069428ae9814113f5883` — **ROTATE THIS** (was shared in chat plaintext; see note below) |
| `NIXPACKS_PYTHON_VERSION` | `3.11.9` |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` |
| `ENVIRONMENT` | `production` |
| `CORS_ORIGINS` | `http://localhost:5173` — **PLACEHOLDER**, must be updated to the Netlify URL once Netlify is deployed |

### DATABASE_URL rules — read carefully

- **Railway runtime** must use the **Supabase transaction pooler**, port **6543**:
  `aws-0-ap-northeast-1.pooler.supabase.com:6543`
- **Alembic migrations** must use the **direct connection**, which is IPv6-only:
  `db.gxlkkbyknqbreqxuzwhu.supabase.co:5432`
- Nothing in the app startup path runs migrations. `alembic/env.py` is only
  executed when you explicitly run `python -m alembic upgrade head` locally.
  The FastAPI startup chain is: `main.py → database.py → engine creation`. No Alembic import.
- The `?` in the Supabase password (`R?Ak.SxT_P89t6x`) must be **percent-encoded as `%3F`**
  in the SQLAlchemy URL or the engine misparsed the query string. It is already encoded in
  the value set on Railway.

### Supabase state

**Migrations: NOT run.** The Supabase database is empty.  
**Seed: NOT run.** No data in Supabase yet.

Before the app will work in production:
```bash
# Use the DIRECT connection (port 5432) for Alembic — not the pooler
DATABASE_URL="postgresql+psycopg2://postgres:PASSWORD@db.gxlkkbyknqbreqxuzwhu.supabase.co:5432/postgres" \
  python -m alembic upgrade head

# Then seed (also uses direct connection locally)
DATABASE_URL="postgresql+psycopg2://postgres:PASSWORD@db.gxlkkbyknqbreqxuzwhu.supabase.co:5432/postgres" \
  python -m seed.seed
```

### What to do in the next session

1. **Check the Railway deploy** — go to the Railway dashboard or run `railway logs --service nexora-analytics-api --build` to see if the build finished and what Python version Nixpacks selected. Verify it says `3.11.x`, not `3.12` or higher.

2. **Generate a public domain** — `railway domain --service nexora-analytics-api`. Railway does not auto-generate one.

3. **Hit /health** — `curl https://RAILWAY_URL/health` should return `{"status":"ok","db":"ok"}`. If `db` is `"unreachable"`, the transaction pooler URL or the `sslmode=require` is wrong.

4. **Run migrations and seed against Supabase** (see commands above, using direct connection).

5. **Rotate SECRET_KEY** — the value in this CLAUDE.md and in the Railway dashboard was transmitted through Claude's servers and must be considered compromised. Generate a new one: `openssl rand -hex 32`, paste it into Railway env vars, trigger a redeploy. All existing JWTs will be invalidated (fine for a portfolio project with no real users).

6. **Deploy Netlify frontend**, then update `CORS_ORIGINS` on Railway to the Netlify URL.

7. **Update DEPLOYMENT.md** — it currently describes the Render workflow. Rewrite it for Railway.
