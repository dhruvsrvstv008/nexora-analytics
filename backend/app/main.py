from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app = FastAPI(
    title="Nexora Analytics API",
    description="Business Intelligence & Operations Analytics Platform",
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

# Routes will be added per phase; auth is wired here as a placeholder
from app.routes import auth  # noqa: E402
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])


@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok", "service": "nexora-analytics", "environment": settings.ENVIRONMENT}
