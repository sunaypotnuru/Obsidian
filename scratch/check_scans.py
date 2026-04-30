import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_KEY')
print(f"URL: {url}")
print(f"Key Prefix: {key[:10]}...")

supabase = create_client(url, key)

res = supabase.table('scans').select('*').limit(5).execute()
print(f"Data: {res.data}")
