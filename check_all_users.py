
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

emails = ["sunaysujsy@gmail.com", "rohithpanduru8@gmail.com", "sunaypotnuru@gmail.com"]
users = supabase.auth.admin.list_users()

for email in emails:
    user = next((u for u in users if u.email == email), None)
    if user:
        print(f"Email: {email}")
        print(f"  User ID: {user.id}")
        print(f"  User Metadata: {user.user_metadata}")
        print(f"  App Metadata: {user.app_metadata}")
    else:
        print(f"Email: {email} - Not found")
