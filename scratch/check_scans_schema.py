import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
service_key = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(url, service_key)

try:
    # We can't directly get schema easily with supabase-py, but we can try to get one row and see keys
    res = supabase.table("scans").select("*").limit(1).execute()
    if res.data:
        print("Columns in 'scans' table:")
        print(list(res.data[0].keys()))
    else:
        print("No data in 'scans' table to check columns.")
except Exception as e:
    print(f"Error: {e}")
