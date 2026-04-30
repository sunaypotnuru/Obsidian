from supabase import create_client, Client
from app.core.config import settings

# Export a configured synchronous Supabase client using the Service Role Key.
# This client bypasses RLS, so use it carefully within secured backend routes!
supabase: Client = create_client(
    supabase_url=settings.SUPABASE_URL, supabase_key=settings.SUPABASE_SERVICE_KEY
)
