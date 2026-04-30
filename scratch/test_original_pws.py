import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

anon_client = create_client(url, key)

tests = [
    ("sunaysujsy@gmail.com", "patient123"),
    ("rohithpanduru8@gmail.com", "doctor123"),
    ("sunaypotnuru@gmail.com", "admin123")
]

print("--- Testing Original Script Passwords ---")
for email, pw in tests:
    try:
        response = anon_client.auth.sign_in_with_password({"email": email, "password": pw})
        if response.user:
            print(f"[SUCCESS] {email} with {pw}")
        else:
            print(f"[FAILED] {email} with {pw}")
    except Exception as e:
        print(f"[FAILED] {email} with {pw}: {str(e)}")
