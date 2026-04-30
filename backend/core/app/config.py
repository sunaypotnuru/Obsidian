"""
DEPRECATED: This file is a legacy config module.
Use `app.core.config.settings` (pydantic-settings) for all new code.
This shim remains for any legacy imports that may still reference it.
"""

# Re-export from the canonical settings to avoid creating a duplicate Supabase client
from app.core.config import settings as _settings
from app.services.supabase import supabase  # noqa: F401

SUPABASE_URL = _settings.SUPABASE_URL
SUPABASE_KEY = _settings.SUPABASE_SERVICE_KEY
LIVEKIT_API_KEY = _settings.LIVEKIT_API_KEY or ""
LIVEKIT_API_SECRET = _settings.LIVEKIT_API_SECRET or ""
LIVEKIT_URL = _settings.LIVEKIT_URL or ""
ANEMIA_API_URL = _settings.ANEMIA_API_URL
