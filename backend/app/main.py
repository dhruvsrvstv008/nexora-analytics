from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_db
from app.routes import auth, executive, sales, managers, workforce, salary, inventory, finance, hr, admin

app = FastAPI(
    title="Nexora Analytics API",
    description="Business Intelligence & Operations Analytics Platform — "
                "a portfolio-grade BI system built with Python + FastAPI + PostgreSQL.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

V1 = "/api/v1"

app.include_router(auth.router,       prefix=f"{V1}/auth",      tags=["auth"])
app.include_router(executive.router,  prefix=f"{V1}/executive",  tags=["executive"])
app.include_router(sales.router,      prefix=f"{V1}/sales",      tags=["sales"])
app.include_router(managers.router,   prefix=f"{V1}/managers",   tags=["managers"])
app.include_router(workforce.router,  prefix=f"{V1}/workforce",  tags=["workforce"])
app.include_router(salary.router,     prefix=f"{V1}/salary",     tags=["salary"])
app.include_router(inventory.router,  prefix=f"{V1}/inventory",  tags=["inventory"])
app.include_router(finance.router,    prefix=f"{V1}/finance",    tags=["finance"])
app.include_router(hr.router,         prefix=f"{V1}/hr",         tags=["hr"])
app.include_router(admin.router,      prefix=f"{V1}/admin",      tags=["admin"])


@app.get("/health", tags=["system"])
def health_check(db: Session = Depends(get_db)):
    """Liveness + readiness check. Render uses this to detect a failed deploy."""
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    status = "ok" if db_ok else "degraded"
    return {
        "status": status,
        "service": "nexora-analytics",
        "environment": settings.ENVIRONMENT,
        "db": "ok" if db_ok else "unreachable",
    }
