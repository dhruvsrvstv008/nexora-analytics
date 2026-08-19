# Deployment Guide

Architecture: **Netlify** (frontend) + **Render** (FastAPI backend) + **Supabase** (PostgreSQL).

---

## Prerequisites

- GitHub repo pushed and accessible (already done)
- Accounts at supabase.com, render.com, netlify.com (all free)

---

## Step 1 — Supabase (database, ~5 min)

1. **Create project** at supabase.com → New project.
   - Choose a region close to your Render region (e.g. Singapore).
   - Set a strong database password and save it — you will not see it again.

2. **Get the connection string**
   - Project Settings → Database → Connection string → **Session mode** tab.
   - It looks like:
     ```
     postgresql://postgres.XXXX:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
     ```
   - Copy it. Replace the psycopg2 driver prefix for Python:
     ```
     postgresql+psycopg2://postgres.XXXX:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
     ```

3. **Run migrations** (from your local machine, with `backend/.env` pointing at Supabase):
   ```bash
   cd backend
   DATABASE_URL="postgresql+psycopg2://..." python -m alembic upgrade head
   ```

4. **Seed the database**:
   ```bash
   DATABASE_URL="postgresql+psycopg2://..." python -m seed.seed
   ```
   Expected output: 15,173 orders, 44,473 sale items, 19 MB total. Takes ~60–90s.

5. **Verify** in Supabase → Table Editor: `sales`, `employees`, `products` should all have rows.

---

## Step 2 — Render (backend, ~10 min)

1. **Create Web Service** at render.com → New → Web Service.
   - Connect your GitHub repo.
   - Render detects `render.yaml` automatically. Accept the defaults.

2. **Set environment variables** in the Render dashboard (Environment tab):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | The `postgresql+psycopg2://...` string from Step 1 |
   | `SECRET_KEY` | Run `openssl rand -hex 32` locally and paste the output |
   | `CORS_ORIGINS` | Your Netlify URL — get this in Step 3, then come back and set it |
   | `ALGORITHM` | `HS256` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
   | `REFRESH_TOKEN_EXPIRE_DAYS` | `7` |
   | `ENVIRONMENT` | `production` |

   > `DATABASE_URL` and `SECRET_KEY` have no defaults — the app refuses to
   > start without them. The deploy will show as failed until they are set.

3. **Deploy**. Render runs `pip install -r backend/requirements.txt` then starts uvicorn.

4. **Health check** — Render pings `GET /health` and expects `{"status":"ok","db":"ok"}`.
   If `db` is `"unreachable"`, the `DATABASE_URL` is wrong or Supabase is paused.

5. **Note your Render URL**: `https://nexora-analytics-api.onrender.com`
   (or whatever Render assigns). You will need this for Step 3.

---

## Step 3 — Netlify (frontend, ~5 min)

1. **Import repo** at app.netlify.com → Add new site → Import from Git.
   - Build command: `npm ci && npm run build`
   - Publish directory: `frontend/dist`
   - Base directory: `frontend`
   - (These are already set in `netlify.toml` — Netlify reads them automatically.)

2. **Set environment variable**:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | Your Render URL, e.g. `https://nexora-analytics-api.onrender.com` |

   > This is a **build-time** variable. It gets embedded in the JS bundle when
   > Netlify runs `npm run build`. Setting it after the build does nothing —
   > you must trigger a redeploy after adding it.

3. **Trigger a deploy** (Deploys → Trigger deploy → Deploy site).

4. **Note your Netlify URL**: `https://nexora.netlify.app` (or the one Netlify assigns).

5. **Go back to Render** and set:
   ```
   CORS_ORIGINS = https://nexora.netlify.app
   ```
   Render redeploys automatically. Without this, the browser will block all API
   calls from the Netlify domain with a CORS error.

---

## Step 4 — Custom domain (optional)

In Netlify → Domain management, add your domain and follow the DNS instructions.
Then update `CORS_ORIGINS` on Render to match the custom domain.

---

## Post-deploy checklist

- [ ] `https://YOUR_RENDER_URL/health` returns `{"status":"ok","db":"ok"}`
- [ ] `https://YOUR_RENDER_URL/docs` loads the Swagger UI
- [ ] Netlify site loads and redirects to `/login`
- [ ] Login as `admin@nexora.dev` / `Admin@123` — Executive dashboard renders real data
- [ ] Navigate to `/salary` — salary bands chart loads (was a 500 before SQL fix)
- [ ] Navigate to `/hierarchy` — org tree shows 182 employees
- [ ] Hard-refresh on `/sales` — does not 404 (SPA redirect in `netlify.toml`)
- [ ] Login as `manager@nexora.dev` / `Manager@123` — confirm `/salary/top-earners` returns 403

---

## Cold start behaviour

The Render free tier **sleeps after 15 minutes of inactivity**. The first request
after sleep takes approximately 50 seconds while the dyno wakes and re-establishes
the database connection.

**What users see**: all dashboard cards show skeleton loaders. A dark toast banner
appears after 4 seconds explaining the delay and showing elapsed time. It dismisses
automatically once the first API response arrives.

This is expected and documented. If your portfolio reviewer hits the site cold,
the banner tells them what is happening. Subsequent requests are fast.

To avoid cold starts entirely, upgrade to Render's Starter plan ($7/mo) which
does not sleep.

---

## Environment variable reference

### Render (backend)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | `postgresql+psycopg2://...` — Supabase Session Mode, port 5432 |
| `SECRET_KEY` | ✅ Yes | `openssl rand -hex 32` — never reuse the dev value |
| `CORS_ORIGINS` | ✅ Yes | Comma-separated Netlify URLs, no trailing slash |
| `ALGORITHM` | No | Default: `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Default: `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | Default: `7` |
| `ENVIRONMENT` | No | Set to `production` for clean log output |

### Netlify (frontend)

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_URL` | ✅ Yes | Full Render URL, no trailing slash, no `/api/v1` suffix |

---

## Database size (Supabase free tier: 500 MB)

| Table | Size |
|---|---|
| `sale_items` (44,473 rows) | 5.0 MB |
| `sales` (15,173 rows) | 3.0 MB |
| `stock_movements` | 0.7 MB |
| All other tables + mat. view | ~2.5 MB |
| **Total application data** | **~11 MB** |
| Supabase system overhead | ~8 MB |
| **Total on Supabase** | **~19 MB / 500 MB (3.8%)** |

The full 24-month seed ships to production. No reduced dataset needed.

---

## Re-seeding

If you need to reset the production database:
```bash
# Wipe and re-seed (idempotent — seed.py truncates before inserting)
DATABASE_URL="postgresql+psycopg2://..." python -m seed.seed
```

The seed uses `random.seed(42)` — running it again produces identical data.
