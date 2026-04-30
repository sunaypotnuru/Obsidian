# 🚀 Quick Fix Guide - Document Upload & Login

## What Was Fixed

✅ **Document Upload DNS Error** - Added DNS servers to Docker config  
✅ **Login Authentication** - Disabled BYPASS_AUTH, enabled real login  
✅ **Test User Creation** - Automated scripts to create test accounts

## 3-Step Setup

### Step 1: Restart Docker Services

**Windows:**
```bash
restart-services.bat
```

**Linux/Mac:**
```bash
chmod +x restart-services.sh
./restart-services.sh
```

### Step 2: Update Existing User Roles

Since you already have users in Supabase, run this to add role metadata:

**Windows:**
```bash
update-roles.bat
```

**Linux/Mac:**
```bash
chmod +x update-roles.sh
./update-roles.sh
```

This will update your existing users:
- **rohithpanduru8@gmail.com** → Doctor
- **sunaypotnuru@gmail.com** → Admin
- **sunaysujsy@gmail.com** → Patient

### Step 3: Test Everything

1. **Login:** http://localhost:3000/login
2. **Use your existing passwords** for the emails above
3. **Upload Document:** Login → My Documents → Upload Document
4. **Verify:** Document should upload successfully (no DNS error)

## That's It! 🎉

Your system is now fixed and ready to use with real authentication.

## Troubleshooting

**If user creation fails:**
- Check your `.env` file has correct `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Verify your Supabase project is active
- Try creating users manually via Supabase Dashboard

**If document upload still fails:**
- Check backend logs: `docker-compose logs backend`
- Verify services are healthy: `docker-compose ps`
- Test DNS inside container: `docker exec -it netra-backend ping google.com`

## Files Created/Modified

- ✅ `.env` - Disabled BYPASS_AUTH
- ✅ `docker/docker-compose.yml` - Added DNS config
- ✅ `scripts/create-test-users.py` - Python user creation script
- ✅ `scripts/create-test-users.js` - Node.js user creation script
- ✅ `create-users.bat` / `create-users.sh` - Quick user creation
- ✅ `restart-services.bat` / `restart-services.sh` - Quick restart
- ✅ Documentation files

## Need Help?

See `DOCUMENT_UPLOAD_AND_LOGIN_FIXES.md` for detailed information.
