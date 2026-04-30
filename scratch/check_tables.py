import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

try:
    res = supabase.table("profiles_patient").select("*").limit(1).execute()
    print("profiles_patient exists")
except Exception as e:
    print(f"profiles_patient error: {e}")

try:
    # Check join
    res = supabase.table("waitlist").select("*, profiles_patient(full_name)").limit(1).execute()
    print("waitlist -> profiles_patient join works")
except Exception as e:
    print(f"waitlist -> profiles_patient join error: {e}")
