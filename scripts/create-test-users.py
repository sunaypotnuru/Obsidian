#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
"""
Script to create test users in Supabase for Netra AI
This script uses the Supabase Admin API to create users with proper roles
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
    print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file")
    sys.exit(1)

# Create Supabase admin client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Test users to create
TEST_USERS = [
    {
        "email": "sunaysujsy@gmail.com",
        "password": "patient123",
        "role": "patient",
        "full_name": "Sunay Sujsy",
    },
    {
        "email": "rohithpanduru8@gmail.com",
        "password": "doctor123",
        "role": "doctor",
        "full_name": "Rohith Panduru",
    },
    {
        "email": "sunaypotnuru@gmail.com",
        "password": "admin123",
        "role": "admin",
        "full_name": "Sunay Potnuru",
    },
]

def create_user(email: str, password: str, role: str, full_name: str):
    """Create a user in Supabase with the specified role"""
    try:
        print(f"Creating {role} user: {email}...")
        
        # Create user with Supabase Auth
        response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,  # Auto-confirm email
            "user_metadata": {
                "role": role,
                "full_name": full_name,
            }
        })
        
        if response.user:
            user_id = response.user.id
            print(f"  [OK] User created with ID: {user_id}")
            
            # Create profile in appropriate table
            if role == "patient":
                profile_data = {
                    "id": user_id,
                    "user_id": user_id,
                    "full_name": full_name,
                    "email": email,
                }
                supabase.table("profiles_patient").insert(profile_data).execute()
                print(f"  [OK] Patient profile created")
                
            elif role == "doctor":
                profile_data = {
                    "id": user_id,
                    "user_id": user_id,
                    "full_name": full_name,
                    "email": email,
                    "specialization": "General Medicine",
                    "verified": True,  # Auto-verify for testing
                }
                supabase.table("profiles_doctor").insert(profile_data).execute()
                print(f"  [OK] Doctor profile created")
                
            elif role == "admin":
                # Admins typically use doctor profile table
                profile_data = {
                    "id": user_id,
                    "user_id": user_id,
                    "full_name": full_name,
                    "email": email,
                    "specialization": "Administration",
                    "verified": True,
                }
                supabase.table("profiles_doctor").insert(profile_data).execute()
                print(f"  [OK] Admin profile created")
            
            return True
        else:
            print(f"  [FAIL] Failed to create user")
            return False
            
    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower() or "already exists" in error_msg.lower():
            print(f"  [WARN] User already exists: {email}")
            return True
        else:
            print(f"  [ERROR] Error: {error_msg}")
            return False

def main():
    print("[*] Creating test users for Netra AI...\n")
    print(f"Supabase URL: {SUPABASE_URL}\n")
    
    success_count = 0
    for user in TEST_USERS:
        if create_user(
            email=user["email"],
            password=user["password"],
            role=user["role"],
            full_name=user["full_name"]
        ):
            success_count += 1
        print()
    
    print("=" * 60)
    print(f"[OK] Successfully created/verified {success_count}/{len(TEST_USERS)} users\n")
    print("[*] Test User Credentials:")
    print("-" * 60)
    for user in TEST_USERS:
        print(f"{user['role'].upper():8} | Email: {user['email']:30} | Password: {user['password']}")
    print("-" * 60)
    print("\n[*] Login URLs:")
    print(f"  Patient: http://localhost:5173/login/patient")
    print(f"  Doctor:  http://localhost:5173/login/doctor")
    print(f"  Admin:   http://localhost:5173/login/admin")
    print("\n[OK] You can now login with these credentials!")

if __name__ == "__main__":
    main()
