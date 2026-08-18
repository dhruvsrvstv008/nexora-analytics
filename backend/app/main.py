from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
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
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
def health_check():
    return {"status": "ok", "service": "nexora-analytics", "environment": settings.ENVIRONMENT}
