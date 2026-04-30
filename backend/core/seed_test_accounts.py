import os
import logging
from datetime import datetime, timedelta

# Mock app environment to reuse the Supabase client
import sys
from pathlib import Path

# Add the app directory to the python path
sys.path.insert(0, str(Path(__file__).parent.parent / "core"))

from app.services.supabase import supabase as supabase_admin
from app.db.schema import Tables

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# SECURITY: Use environment variable for test password
PASSWORD = os.getenv("TEST_ACCOUNT_PASSWORD", "TestPassword123!")

USERS = [
    {
        "email": "sunaysujsy@gmail.com",
        "role": "patient",
        "full_name": "Sunay Patient",
        "table": Tables.PROFILES_PATIENT,
        "data": {
            "age": 28,
            "blood_type": "O+",
            "gender": "male",
            "phone": "+918125914593",
            "health_score": 85,
            "points": 1200,
        }
    },
    {
        "email": "rohithpanduru8@gmail.com",
        "role": "doctor",
        "full_name": "Dr. Rohith Panduru",
        "table": Tables.PROFILES_DOCTOR,
        "data": {
            "specialty": "Hematology",
            "rating": 4.9,
            "is_verified": True,
            "consultation_fee": 500,
            "experience_years": 12,
            "license_number": "MED-123456",
            "bio": "Specialist in AI-powered anemia detection and blood disorders.",
            "phone": "+918125914594"
        }
    },
    {
        "email": "sunaypotnuru@gmail.com",
        "role": "admin",
        "full_name": "Sunay Admin",
        "table": None,
        "data": {}
    }
]

def seed():
    logger.info("Starting database seeding...")
    
    # Get all users to check existence
    try:
        users_res = supabase_admin.auth.admin.list_users()
        # Some versions of supabase-py return an object with 'users' attribute
        auth_users = users_res.users if hasattr(users_res, 'users') else users_res
    except Exception as e:
        logger.error(f"Failed to list users: {e}")
        return

    user_ids = {}

    for u in USERS:
        logger.info(f"Processing user: {u['email']} ({u['role']})")
        
        existing_user = next((x for x in auth_users if x.email == u["email"]), None)
        
        try:
            if existing_user:
                user_id = existing_user.id
                logger.info(f"User exists: {user_id}. Updating password and metadata...")
                supabase_admin.auth.admin.update_user_by_id(user_id, {
                    "password": PASSWORD,
                    "user_metadata": {"role": u["role"], "full_name": u["full_name"]},
                    "email_confirm": True
                })
            else:
                logger.info("Creating new user...")
                res = supabase_admin.auth.admin.create_user({
                    "email": u["email"],
                    "password": PASSWORD,
                    "user_metadata": {"role": u["role"], "full_name": u["full_name"]},
                    "email_confirm": True
                })
                user_id = res.user.id
            
            user_ids[u["email"]] = user_id

            # 2. Create/Update Profile
            if u["table"]:
                profile_data = {
                    "id": user_id,
                    "email": u["email"],
                    "full_name": u["full_name"],
                    **u["data"]
                }
                supabase_admin.table(u["table"]).upsert(profile_data).execute()
                logger.info(f"Profile updated in {u['table']}")

        except Exception as e:
            logger.error(f"Error seeding user {u['email']}: {e}")

    # 3. Seed additional data for the patient
    p_email = "sunaysujsy@gmail.com"
    d_email = "rohithpanduru8@gmail.com"
    
    if p_email in user_ids and d_email in user_ids:
        patient_id = user_ids[p_email]
        doctor_id = user_ids[d_email]
        
        try:
            # Seed Appointment
            supabase_admin.table(Tables.APPOINTMENTS).upsert({
                "patient_id": patient_id,
                "doctor_id": doctor_id,
                "scheduled_at": (datetime.now() + timedelta(days=2)).isoformat(),
                "status": "booked",
                "type": "video",
                "reason": "Anemia screening follow-up",
                "notes": "Patient reports mild fatigue."
            }).execute()
            logger.info("Appointment seeded.")

            # Seed Document
            supabase_admin.table(Tables.DOCUMENTS).upsert({
                "patient_id": patient_id,
                "uploaded_by": patient_id,
                "title": "Historical Blood Test",
                "description": "Previous lab results from City Hospital",
                "category": "lab_report",
                "file_url": "demo/blood_test.pdf",
                "file_size": 1024,
                "file_type": "application/pdf"
            }).execute()
            logger.info("Document seeded.")

            # Seed Medical History
            # Note: Checking if there's a medical history table. 
            # In schema.py, I saw Tables.VITALS_LOG and Tables.PRESCRIPTIONS.
            supabase_admin.table(Tables.VITALS_LOG).upsert({
                "patient_id": patient_id,
                "tracker_type": "heart_rate",
                "value": "72",
                "unit": "bpm",
                "notes": "Resting heart rate"
            }).execute()
            logger.info("Vitals log seeded.")

        except Exception as e:
            logger.error(f"Error seeding related data: {e}")

    logger.info("Seeding complete!")

if __name__ == "__main__":
    seed()
