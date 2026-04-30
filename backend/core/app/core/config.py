from pydantic_settings import BaseSettings  # type: ignore
from typing import Optional
import os

# Support running from repo root OR from services/core/ directory
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_ENV_FILE = os.path.join(_BASE_DIR, "..", "..", "..", "..", ".env")
if not os.path.exists(_ENV_FILE):
    _ENV_FILE = os.path.join(_BASE_DIR, "..", "..", "..", ".env")
if not os.path.exists(_ENV_FILE):
    _ENV_FILE = ".env"


class Settings(BaseSettings):
    # Supabase (Database & Auth)
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str

    # LiveKit (Video Calls)
    LIVEKIT_API_KEY: Optional[str] = None
    LIVEKIT_API_SECRET: Optional[str] = None
    LIVEKIT_URL: Optional[str] = None

    # JWT Secret for signature verification
    SUPABASE_JWT_SECRET: Optional[str] = None

    # Frontend URL for CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # External ML API
    ANEMIA_API_URL: str = "http://localhost:8001"
    MENTAL_HEALTH_API_URL: str = "http://mental-health:8003"
    CATARACT_API_URL: str = "http://cataract:8005"
    DR_API_URL: str = "http://diabetic-retinopathy:8002"
    PARKINSONS_API_URL: str = "http://parkinsons-voice:8004"

    # Razorpay Payment Gateway
    RAZORPAY_KEY_ID: str = "rzp_test_mock_12345"
    RAZORPAY_KEY_SECRET: str = "mock_secret_12345"

    # Twilio SMS Gateway
    TWILIO_ACCOUNT_SID: str = "AC_mock_sid"
    TWILIO_AUTH_TOKEN: str = "mock_auth_token"
    TWILIO_PHONE_NUMBER: str = "+1234567890"
    SOS_EMERGENCY_PHONE: str = "+919999999999"

    # SendGrid Email Gateway
    SENDGRID_API_KEY: str = "SG_mock_key"
    SENDGRID_FROM_EMAIL: str = "noreply@netra-ai.com"
    SENDGRID_FROM_NAME: str = "Netra AI"

    # Environment and Feature Flags
    ENVIRONMENT: str = "development"  # development, staging, production
    ALLOW_MOCK_RESPONSES: bool = True  # Allow mock responses in development
    BYPASS_AUTH: bool = False  # Bypass authentication (development only)

    # Frontend/API
    API_V1_STR: str = "/api/v1"

    # Development — set BYPASS_AUTH=true in .env for local dev only
    BYPASS_AUTH: bool = False

    # Payments — set ENABLE_PAYMENTS=false to skip Razorpay during testing
    ENABLE_PAYMENTS: bool = True

    model_config = {
        "env_file": _ENV_FILE,
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "case_sensitive": True,
    }


settings = Settings()
