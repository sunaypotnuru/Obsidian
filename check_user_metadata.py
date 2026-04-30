
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

email = "sunaysujsy@gmail.com"
users = supabase.auth.admin.list_users()
user = next((u for u in users if u.email == email), None)

if user:
    print(f"User ID: {user.id}")
    print(f"User Metadata: {user.user_metadata}")
    print(f"App Metadata: {user.app_metadata}")
else:
    print("User not found")
