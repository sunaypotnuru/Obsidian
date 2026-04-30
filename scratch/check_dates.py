from app.services.supabase import supabase
from app.db.schema import Tables

def check_dates():
    print("Checking Appointments...")
    res = supabase.table(Tables.APPOINTMENTS).select("id, scheduled_at").execute()
    for row in (res.data or []):
        if not row.get("scheduled_at"):
            print(f"Appointment {row['id']} has no scheduled_at!")
        else:
            print(f"Appointment {row['id']}: {row['scheduled_at']}")

    print("\nChecking Waitlist...")
    res = supabase.table(Tables.WAITLIST).select("id, preferred_date, created_at").execute()
    for row in (res.data or []):
        print(f"Waitlist {row['id']}: preferred_date={row.get('preferred_date')}, created_at={row.get('created_at')}")

if __name__ == "__main__":
    check_dates()
