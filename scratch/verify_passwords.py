import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
service_key = os.getenv("SUPABASE_SERVICE_KEY")

users_to_test = [
    "sunaysujsy@gmail.com",
    "rohithpanduru8@gmail.com",
    "sunaypotnuru@gmail.com"
]

password = "NetrAI2024!"

print(f"--- Testing Password Verification ---")
print(f"Target Password: {password}\n")

# 1. Test Login (Anon Key)
anon_client = create_client(url, key)

for email in users_to_test:
    try:
        response = anon_client.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        if response.user:
            print(f"[SUCCESS] {email}: Login worked!")
        else:
            print(f"[FAILED] {email}: Login failed (No user in response)")
    except Exception as e:
        if "Invalid login credentials" in str(e):
            print(f"[FAILED] {email}: Invalid login credentials")
        else:
            print(f"[ERROR] {email}: {str(e)}")

print("\n--- Admin User Status Check ---")
# 2. Check User Existence (Service Key)
admin_client = create_client(url, service_key)

try:
    # list_users returns a list of users
    response = admin_client.auth.admin.list_users()
    all_users = response
    
    found_emails = {u.email: u for u in all_users if u.email in users_to_test}
    
    for email in users_to_test:
        if email in found_emails:
            u = found_emails[email]
            print(f"[EXIST] {email}: Found. Last sign in: {u.last_sign_in_at}")
        else:
            print(f"[MISSING] {email}: Not found in Supabase Auth")

except Exception as e:
    print(f"[ERROR] Admin check failed: {str(e)}")
