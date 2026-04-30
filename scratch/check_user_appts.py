from app.services.supabase import supabase
from app.db.schema import Tables

def check_user_appointments(email):
    print(f"Checking for {email}...")
    # Find user ID
    # Note: supabase.auth.admin.list_users() might require service role key which we might not have in the same way.
    # We can try to find the patient profile first.
    res = supabase.table("profiles_patient").select("id").eq("email", email).execute()
    if not res.data:
        # Try full_name or something? No, email should work if it exists in profiles.
        # Let's try searching profiles_patient for this email
        print("Searching all profiles for email...")
        res = supabase.table("profiles_patient").select("id, email").execute()
        patient = next((p for p in (res.data or []) if p.get("email") == email), None)
        if not patient:
            print(f"Patient with email {email} not found in profiles_patient.")
            return
        patient_id = patient["id"]
    else:
        patient_id = res.data[0]["id"]
    
    print(f"Patient ID: {patient_id}")
    
    # Check appointments
    res = supabase.table(Tables.APPOINTMENTS).select("*").eq("patient_id", patient_id).execute()
    print(f"Found {len(res.data or [])} appointments.")
    for appt in (res.data or []):
        print(f"Appt {appt['id']}: scheduled_at={appt.get('scheduled_at')}, status={appt.get('status')}")
    
    # Check waitlist
    res = supabase.table(Tables.WAITLIST).select("*").eq("patient_id", patient_id).execute()
    print(f"Found {len(res.data or [])} waitlist entries.")
    for w in (res.data or []):
        print(f"Waitlist {w['id']}: preferred_date={w.get('preferred_date')}, created_at={w.get('created_at')}")

if __name__ == "__main__":
    import sys
    email = sys.argv[1] if len(sys.argv) > 1 else "sunaysujsy@gmail.com"
    check_user_appointments(email)
