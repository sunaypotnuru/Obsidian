import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

anon_client = create_client(url, key)

users_to_test = [
    "sunaysujsy@gmail.com",
    "rohithpanduru8@gmail.com",
    "sunaypotnuru@gmail.com"
]

password = "NetraAI2024!"

print(f"Testing password: {password}\n")

for email in users_to_test:
    try:
        response = anon_client.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        if response.user:
            print(f"[SUCCESS] {email}: Login worked!")
        else:
            print(f"[FAILED] {email}: Login failed")
    except Exception as e:
        if "Invalid login credentials" in str(e):
            print(f"[FAILED] {email}: Invalid login credentials")
        else:
            print(f"[ERROR] {email}: {str(e)}")
