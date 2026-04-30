#!/usr/bin/env python3
"""
Script to update existing Supabase users with proper role metadata
This will add/update the 'role' field in user_metadata for existing users
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("[FAIL] Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file")
    sys.exit(1)

# Create Supabase admin client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Email to role mapping based on your screenshot
USER_ROLES = {
    "rohithpanduru8@gmail.com": "doctor",
    "sunaypotnuru@gmail.com": "admin",
    "sunaysujsy@gmail.com": "patient",
}

def update_user_role(email: str, role: str):
    """Update user metadata with role"""
    try:
        print(f"Updating {email} with role: {role}...")
        
        # Get all users
        response = supabase.auth.admin.list_users()
        
        # Find user by email
        user = None
        for u in response:
            if u.email == email:
                user = u
                break
        
        if not user:
            print(f"  [WARN] User not found: {email}")
            return False
        
        user_id = user.id
        
        # Update user metadata
        supabase.auth.admin.update_user_by_id(
            user_id,
            {
                "user_metadata": {
                    "role": role,
                }
            }
        )
        
        print(f"  [OK] Updated user {email} (ID: {user_id}) with role: {role}")
        
        # Check if profile exists, create if not
        if role == "patient":
            # Check if profile exists
            existing = supabase.table("profiles_patient").select("id").eq("id", user_id).execute()
            if not existing.data:
                profile_data = {
                    "id": user_id,
                    "user_id": user_id,
                    "email": email,
                }
                supabase.table("profiles_patient").insert(profile_data).execute()
                print(f"  [OK] Created patient profile")
            else:
                print(f"  [INFO] Patient profile already exists")
                
        elif role == "doctor":
            existing = supabase.table("profiles_doctor").select("id").eq("id", user_id).execute()
            if not existing.data:
                profile_data = {
                    "id": user_id,
                    "user_id": user_id,
                    "email": email,
                    "specialization": "General Medicine",
                    "verified": True,
                }
                supabase.table("profiles_doctor").insert(profile_data).execute()
                print(f"  [OK] Created doctor profile")
            else:
                print(f"  [INFO] Doctor profile already exists")
                
        elif role == "admin":
            existing = supabase.table("profiles_doctor").select("id").eq("id", user_id).execute()
            if not existing.data:
                profile_data = {
                    "id": user_id,
                    "user_id": user_id,
                    "email": email,
                    "specialization": "Administration",
                    "verified": True,
                }
                supabase.table("profiles_doctor").insert(profile_data).execute()
                print(f"  [OK] Created admin profile")
            else:
                print(f"  [INFO] Admin profile already exists")
        
        return True
        
    except Exception as e:
        print(f"  [FAIL] Error: {str(e)}")
        return False

def main():
    print("[OK] Updating user roles in Supabase...\n")
    print(f"Supabase URL: {SUPABASE_URL}\n")
    
    success_count = 0
    for email, role in USER_ROLES.items():
        if update_user_role(email, role):
            success_count += 1
        print()
    
    print("=" * 60)
    print(f"[OK] Successfully updated {success_count}/{len(USER_ROLES)} users\n")
    print("📝 User Roles:")
    print("-" * 60)
    for email, role in USER_ROLES.items():
        print(f"{role.upper():8} | {email}")
    print("-" * 60)
    print("\n🌐 Login URLs:")
    print(f"  Patient: http://localhost:3000/login/patient")
    print(f"  Doctor:  http://localhost:3000/login/doctor")
    print(f"  Admin:   http://localhost:3000/login/admin")
    print("\n[OK] Users are now ready to login!")

if __name__ == "__main__":
    main()
