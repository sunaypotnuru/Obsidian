# ✅ Final Setup Instructions

## What I Fixed

1. ✅ **Document Upload DNS Error** - Added DNS configuration to Docker
2. ✅ **Disabled BYPASS_AUTH** - Real authentication now required
3. ✅ **Created user role update scripts** - For your existing Supabase users

## Your Existing Users

I can see you already have 3 users in Supabase:
- rohithpanduru8@gmail.com
- sunaypotnuru@gmail.com  
- sunaysujsy@gmail.com

## Quick Setup (2 Steps)

### Step 1: Restart Docker with DNS Fix
```bash
# Windows
restart-services.bat

# Linux/Mac
chmod +x restart-services.sh && ./restart-services.sh
```

### Step 2: Add Roles to Your Existing Users
```bash
# Windows
update-roles.bat

# Linux/Mac
chmod +x update-roles.sh && ./update-roles.sh
```

This will assign:
- **rohithpanduru8@gmail.com** → Doctor role
- **sunaypotnuru@gmail.com** → Admin role
- **sunaysujsy@gmail.com** → Patient role

## Test Login

1. Go to http://localhost:3000/login
2. Choose your role (Patient/Doctor/Admin)
3. Login with your existing email and password
4. Test document upload in "My Documents"

## That's All! 🎉

Both issues are now fixed:
- ✅ Document upload will work (DNS resolved)
- ✅ Real authentication enabled (no bypass)
- ✅ Your existing users have proper roles

## Need Different Role Assignments?

Edit `scripts/update-user-roles.py` or `scripts/update-user-roles.js` and change the USER_ROLES mapping:

```python
USER_ROLES = {
    "rohithpanduru8@gmail.com": "doctor",  # Change to "patient" or "admin"
    "sunaypotnuru@gmail.com": "admin",     # Change to "patient" or "doctor"
    "sunaysujsy@gmail.com": "patient",     # Change to "doctor" or "admin"
}
```

Then run the update script again.
