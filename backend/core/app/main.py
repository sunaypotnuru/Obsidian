from contextlib import asynccontextmanager  # type: ignore
from fastapi import FastAPI, HTTPException  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
import logging
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
import asyncio

from app.core.config import settings  # type: ignore
from app.routes import patient, doctor, admin, video, ml, hospitals  # type: ignore
from app.routes import audit, messages, gamification, referrals, preferences, documents, insurance, contact  # type: ignore
from app.routes.quality import router as quality_router  # type: ignore
from app.routes.timeline import router as timeline_router  # type: ignore
from app.routes.waitlist import router as waitlist_router  # type: ignore
from app.routes.analytics import router as analytics_router  # type: ignore
from app.routes.search import router as search_router  # type: ignore
from app.routes.i18n import router as i18n_router  # type: ignore
from app.routes.health import router as health_router  # type: ignore
from app.routes.ai import router as ai_router  # type: ignore
from app.routes.settings import router as platform_settings_router  # type: ignore
from app.routes.scribe import router as scribe_router  # type: ignore
from app.routes.payment import router as payment_router  # type: ignore
from app.routes.video import router as video_router  # type: ignore
from app.routes.webhooks import router as webhooks_router  # type: ignore
from app.routes.mental import router as mental_router  # type: ignore
from app.routes.whiteboard import router as whiteboard_router  # type: ignore
from app.routes.voice import router as voice_router  # type: ignore
from app.routes.exercises import router as exercises_router  # type: ignore
from app.routes.semantic_search import router as semantic_search_router  # type: ignore
from app.routes.system_health import router as system_health_router  # type: ignore
from app.routes.configuration import router as configuration_router  # type: ignore
from app.routes.security import router as security_router  # type: ignore
from app.routes.compliance import router as compliance_router  # type: ignore
from app.routes.fhir import router as fhir_router  # type: ignore
from app.routes.ai_models import router as ai_models_router  # type: ignore
from app.routes.intake import router as intake_router  # type: ignore
from app.middleware.activity import ActivityLoggingMiddleware  # type: ignore
from app.middleware.input_validation import SecurityInputValidationMiddleware  # type: ignore
from app.middleware.advanced_rate_limiting import AdvancedRateLimitingMiddleware  # type: ignore
from app.middleware.security_headers import SecurityHeadersMiddleware  # type: ignore
from app.services.supabase import supabase as supabase_admin  # type: ignore
from app.utils.reminders import start_reminder_task  # type: ignore
from app.warmup import warmup_deepseek_sync  # type: ignore
from app.utils.storage_init import initialize_storage_buckets


# PHI scrubbing function for Sentry
def scrub_phi_from_events(event, hint):
    """Remove PHI (Protected Health Information) from Sentry events before sending."""
    # List of sensitive fields to scrub
    sensitive_fields = [
        "email",
        "phone",
        "address",
        "ssn",
        "medical_history",
        "patient_id",
        "doctor_id",
        "prescription",
        "diagnosis",
        "full_name",
        "date_of_birth",
        "blood_type",
        "hemoglobin",
    ]

    # Scrub request data
    if "request" in event:
        if "data" in event["request"]:
            for field in sensitive_fields:
                if field in event["request"]["data"]:
                    event["request"]["data"][field] = "[REDACTED]"

        # Scrub headers
        if "headers" in event["request"]:
            for header in ["Authorization", "Cookie", "X-API-Key"]:
                if header in event["request"]["headers"]:
                    event["request"]["headers"][header] = "[REDACTED]"

    # Scrub extra data
    if "extra" in event:
        for field in sensitive_fields:
            if field in event["extra"]:
                event["extra"][field] = "[REDACTED]"

    return event


# Initialize Sentry with PHI protection
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN", "https://dummy@o0.ingest.sentry.io/0"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,  # Sample only 10% of traces
    before_send=scrub_phi_from_events,
    environment=os.getenv("ENVIRONMENT", "development"),
    # Don't send PII
    send_default_pii=False,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle for the app."""
    logger.info("Starting background tasks...")
    await start_reminder_task()

    # Initialize Supabase storage buckets
    logger.info("Initializing Supabase storage buckets...")
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, initialize_storage_buckets)

    # Warm up DeepSeek-R1 to eliminate first-request delay
    # Run in background executor to prevent blocking Uvicorn startup (Resolves "Unhealthy" status)
    logger.info("Warming up AI models in the background...")
    loop.run_in_executor(None, warmup_deepseek_sync)

    yield


app = FastAPI(
    title="Netra AI Backend API",
    description="Telemedicine platform specializing in AI-powered anemia detection.",
    version="3.0.0",
    lifespan=lifespan,
)


# CORS for React/Vite frontend with strict security
def get_allowed_origins():
    """Get allowed origins based on environment."""
    base_origins = [
        # Always allow local dev origins — Vite uses 5173, nginx/docker uses 3000
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Add configured frontend URL (may be a production domain)
    if settings.FRONTEND_URL and settings.FRONTEND_URL not in base_origins:
        base_origins.append(settings.FRONTEND_URL)

    return base_origins


allowed_origins = get_allowed_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Specific methods only
    # Allow all headers so preflights don't fail when we add new
    # client-side headers (e.g. demo/bypass auth headers).
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-RateLimit-Remaining"],
    max_age=86400,  # 24 hours cache for preflight
)

# Security middleware (order matters - most restrictive first)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(SecurityInputValidationMiddleware)
app.add_middleware(AdvancedRateLimitingMiddleware)

# Activity logging middleware
app.add_middleware(ActivityLoggingMiddleware)

# ─── API Routers ─────────────────────────────────────────
app.include_router(patient.router, prefix=settings.API_V1_STR)
app.include_router(doctor.router, prefix=settings.API_V1_STR)
app.include_router(doctor.public_router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(admin.public_router, prefix=settings.API_V1_STR)
app.include_router(video.router, prefix=settings.API_V1_STR)
app.include_router(ml.router, prefix=settings.API_V1_STR)
app.include_router(hospitals.router, prefix=settings.API_V1_STR)

# ─── New Feature Routers ─────────────────────────────────
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(messages.router, prefix=settings.API_V1_STR)
app.include_router(gamification.router, prefix=settings.API_V1_STR)
app.include_router(referrals.router, prefix=settings.API_V1_STR)
app.include_router(preferences.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(insurance.router, prefix=settings.API_V1_STR)
app.include_router(contact.router, prefix=settings.API_V1_STR)
app.include_router(quality_router, prefix=settings.API_V1_STR)
app.include_router(timeline_router, prefix=settings.API_V1_STR)
app.include_router(waitlist_router, prefix=settings.API_V1_STR)
# Use base versions
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(search_router, prefix=f"{settings.API_V1_STR}/search")

# ─── Batch 5, 6 & 7 Routers ─────────────────────────────
# Use base versions
app.include_router(i18n_router, prefix=settings.API_V1_STR)
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(platform_settings_router, prefix=settings.API_V1_STR)
app.include_router(scribe_router, prefix=settings.API_V1_STR)
app.include_router(payment_router, prefix=settings.API_V1_STR)
app.include_router(video_router, prefix=settings.API_V1_STR)

app.include_router(intake_router, prefix=settings.API_V1_STR)
app.include_router(webhooks_router, prefix=settings.API_V1_STR)
app.include_router(mental_router, prefix=settings.API_V1_STR)
app.include_router(whiteboard_router, prefix=settings.API_V1_STR)
app.include_router(voice_router, prefix=settings.API_V1_STR)
app.include_router(exercises_router, prefix=settings.API_V1_STR)
app.include_router(semantic_search_router, prefix=settings.API_V1_STR)

# Industrial Standards Routes (Phase 1)
app.include_router(system_health_router, prefix=settings.API_V1_STR)
app.include_router(configuration_router, prefix=settings.API_V1_STR)
app.include_router(security_router, prefix=settings.API_V1_STR)

# Admin Portal Completion Routes
app.include_router(compliance_router, prefix=settings.API_V1_STR)
app.include_router(fhir_router, prefix=settings.API_V1_STR)

# Phase 2

# Industrial Standards Routes (Phase 3)
app.include_router(ai_models_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"message": "Netra AI API v3.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/api/v1/auth/confirm-email")
async def confirm_email(payload: dict):
    """Auto-confirm a user's email after signup (dev/demo mode).

    ⚠️ SECURITY NOTE: This endpoint is for development/demo only.
    In production, use proper email verification with time-limited tokens.

    Supabase requires email confirmation before granting sessions.
    Since we don't have email delivery configured, this endpoint
    uses the Admin API to confirm the email immediately.

    IMPORTANT: This should only be called immediately after signup, and the user_id should match the authenticated user.
    """
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    # Security check: Only allow in development mode
    if os.getenv("ENVIRONMENT") == "production":
        raise HTTPException(
            status_code=403,
            detail="Email confirmation must be done via email link in production",
        )

    try:
        supabase_admin.auth.admin.update_user_by_id(user_id, {"email_confirm": True})
        logger.info(f"Email confirmed for user: {user_id}")
        return {"confirmed": True}
    except Exception as e:
        logger.error(f"Failed to confirm email for user {user_id}: {str(e)}")
        return {"confirmed": False, "error": str(e)}
