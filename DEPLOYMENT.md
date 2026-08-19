# Deployment Guide

Architecture: **Netlify** (frontend) + **Railway** (FastAPI backend) + **Supabase** (PostgreSQL).

---

## Prerequisites

- GitHub repo pushed and accessible
- Accounts at supabase.com, railway.app, netlify.com (all have free tiers)
- Railway CLI: `npm install -g @railway/cli`

---

## Step 1 — Supabase (database, ~5 min)

1. **Create project** at supabase.com → New project.
   - Choose a region close to your Railway region (e.g. ap-northeast-1 for Tokyo).
   - Set a strong database password and save it — you will not see it again.
   - If the password contains special characters, percent-encode them in connection strings
     (e.g. `?` → `%3F`).

2. **Get connection strings** — Project Settings → Database → Connection string.

   You need **two** strings for different purposes:

   | Purpose | Connection | Port |
   |---|---|---|
   | Alembic migrations (run locally) | Direct: `db.XXXX.supabase.co` | 5432 |
   | Railway runtime (SQLAlchemy engine) | Transaction pooler: `aws-0-REGION.pooler.supabase.com` | 6543 |

   Both use the `postgresql+psycopg2://` prefix for Python.

3. **Run migrations** from your local machine:
   ```bash
   cd backend
   DATABASE_URL="postgresql+psycopg2://postgres:PASSWORD@db.XXXX.supabase.co:5432/postgres" \
     python -m alembic upgrade head
   ```

4. **Seed the database**:
   ```bash
   DATABASE_URL="postgresql+psycopg2://postgres:PASSWORD@db.XXXX.supabase.co:5432/postgres" \
     python -m seed.seed
   ```
   Expected output: 182 employees, 450 products, 15,173 orders. Takes ~60–90 s.

5. **Verify** in Supabase → Table Editor: `sales`, `employees`, `products` should have rows.

---

## Step 2 — Railway (backend, ~10 min)

Railway auto-detects Python from `backend/.python-version` (3.11.9) and
`backend/nixpacks.toml`. The `backend/Procfile` provides the start command.

1. **Login and create a project**:
   ```bash
   railway login
   railway init          # creates a new project, follow prompts
   ```

2. **Set environment variables** (Railway dashboard → your service → Variables,
   or via `railway variables set KEY=VALUE`):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Transaction pooler URL — `postgresql+psycopg2://postgres.XXXX:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require` |
   | `SECRET_KEY` | `openssl rand -hex 32` — generate fresh, never reuse |
   | `CORS_ORIGINS` | Your Netlify URL (set after Step 3, then redeploy) |
   | `ALGORITHM` | `HS256` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
   | `REFRESH_TOKEN_EXPIRE_DAYS` | `7` |
   | `ENVIRONMENT` | `production` |
   | `NIXPACKS_PYTHON_VERSION` | `3.11.9` |

   > `DATABASE_URL` and `SECRET_KEY` have no defaults — the app refuses to start without them.

3. **Deploy the backend** — the `--path-as-root` flag is critical; without it Railway
   deploys the repo root instead of `backend/` and the build fails:
   ```bash
   railway up --path-as-root ./backend
   ```

4. **Generate a public domain**:
   ```bash
   railway domain
   ```
   Copy the URL (e.g. `https://nexora-analytics-api.up.railway.app`). You need it for Step 3.

5. **Verify** the health endpoint:
   ```bash
   curl https://YOUR_RAILWAY_URL/health
   # Expected: {"status":"ok","db":"ok"}
   ```
   If `db` is `"unreachable"`, check the transaction pooler URL and `sslmode=require`.

---

## Step 3 — Netlify (frontend, ~5 min)

1. **Import repo** at app.netlify.com → Add new site → Import from Git.
   - Build command: `npm ci && npm run build`
   - Publish directory: `frontend/dist`
   - Base directory: `frontend`
   - (These are pre-configured in `netlify.toml` — Netlify reads them automatically.)

2. **Set environment variable** (Site configuration → Environment variables):

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | Your Railway URL, e.g. `https://nexora-analytics-api.up.railway.app` |

   > This is a **build-time** variable. It is embedded in the JS bundle at build time.
   > Setting it after a deploy does nothing — trigger a redeploy after adding it.

3. **Trigger a deploy** (Deploys → Trigger deploy → Deploy site).

4. **Note your Netlify URL** (e.g. `https://nexora.netlify.app`).

5. **Go back to Railway** and update `CORS_ORIGINS` to your Netlify URL. Railway redeploys automatically.

---

## Step 4 — Rotate SECRET_KEY

Generate a fresh key and update it in Railway before sharing the URL publicly:

```bash
openssl rand -hex 32
```

Paste the output into `SECRET_KEY` in the Railway dashboard. This invalidates all existing
JWTs — for a portfolio project with no real users, that is fine.

---

## Post-deploy checklist

- [ ] `GET /health` returns `{"status":"ok","db":"ok"}`
- [ ] `GET /docs` loads the Swagger UI
- [ ] Netlify site loads and redirects to `/login`
- [ ] Login as `admin@nexora.dev` / `Admin@123` — Executive dashboard renders real data
- [ ] Navigate to `/hierarchy` — org tree shows 182 employees
- [ ] Hard-refresh on `/sales` — does not 404 (SPA redirect in `netlify.toml`)
- [ ] Login as `manager@nexora.dev` / `Manager@123` — `/salary/top-earners` returns 403

---

## Environment variable reference

### Railway (backend)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Transaction pooler URL, port 6543, `sslmode=require` |
| `SECRET_KEY` | ✅ | `openssl rand -hex 32` — never reuse the dev value |
| `CORS_ORIGINS` | ✅ | Netlify URL, no trailing slash |
| `NIXPACKS_PYTHON_VERSION` | Recommended | `3.11.9` — prevents Nixpacks selecting 3.12+ |
| `ALGORITHM` | No | Default: `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Default: `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | Default: `7` |
| `ENVIRONMENT` | No | Set to `production` for clean log output |

### Netlify (frontend)

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_URL` | ✅ | Full Railway URL, no trailing slash, no `/api/v1` suffix |

---

## Railway config files

Three files in `backend/` make the Nixpacks build deterministic:

| File | Purpose |
|---|---|
| `.python-version` | `3.11.9` — Nixpacks reads this for version detection |
| `nixpacks.toml` | `[phases.setup] nixPkgs = ["python311"]` — explicit provider, takes precedence |
| `Procfile` | `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1` |

There is no `railway.json`. The backend root is communicated via `railway up --path-as-root ./backend`.
Running plain `railway up` from the repo root deploys the wrong directory and fails silently.

---

## DATABASE_URL: pooler vs direct

| Use case | Connection | Port |
|---|---|---|
| Railway runtime (production) | `aws-0-REGION.pooler.supabase.com` | 6543 |
| Alembic migrations (local) | `db.XXXX.supabase.co` | 5432 |

Nothing in the app startup chain runs migrations. `alembic/env.py` is only executed when you
explicitly run `python -m alembic upgrade head`. Migrations must be run manually from a local
machine using the direct connection — **not** the pooler.

---

## Fallback: Render

`render.yaml` is still in the repo as a documented fallback. Render was the original target
but was abandoned because Nixpacks silently selected Python 3.14 (no pydantic-core wheel)
and the build failed. If you prefer Render, pin Python explicitly in `render.yaml` and use
the Session Mode pooler URL at port 5432.

---

## Re-seeding production

```bash
DATABASE_URL="postgresql+psycopg2://postgres:PASSWORD@db.XXXX.supabase.co:5432/postgres" \
  python -m seed.seed
```

`seed.py` truncates all tables before inserting, so re-runs are idempotent.
The seed uses `random.seed(42)` — re-running produces identical data.

---

## Database size (Supabase free tier: 500 MB)

| Table | Rows | Size |
|---|---|---|
| `sale_items` | 44,473 | 5.0 MB |
| `sales` | 15,173 | 3.0 MB |
| `stock_movements` | — | 0.7 MB |
| All other tables + mat. view | — | ~2.5 MB |
| **Application data** | | **~11 MB** |
| Supabase system overhead | | ~8 MB |
| **Total** | | **~19 MB / 500 MB (3.8%)** |
