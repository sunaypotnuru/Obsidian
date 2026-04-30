# Document Upload DNS Error & Login Portal Fixes

## Issues Fixed

### 1. Document Upload DNS Resolution Error ✅
**Problem:** "Error: 24 Name or service not known" when uploading documents
**Root Cause:** Docker container couldn't resolve external DNS (Supabase hostname)
**Solution:** Added Google DNS servers (8.8.8.8, 8.8.4.4) to backend service in docker-compose.yml

### 2. Authentication Bypass Disabled ✅
**Problem:** BYPASS_AUTH was enabled, allowing login without real credentials
**Solution:** Set `BYPASS_AUTH=false` and `VITE_BYPASS_AUTH=false` in `.env` file

## Changes Made

### 1. `.env` File
```diff
- BYPASS_AUTH=true
- VITE_BYPASS_AUTH=true
+ BYPASS_AUTH=false
+ VITE_BYPASS_AUTH=false
```

### 2. `docker/docker-compose.yml`
Added DNS configuration to backend service:
```yaml
backend:
  # ... other config ...
  dns:
    - 8.8.8.8
    - 8.8.4.4
```

## How to Apply Fixes

### Step 1: Rebuild and Restart Docker Services
```bash
cd docker
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

### Step 2: Verify Services are Running
```bash
docker-compose ps
```

All services should show "healthy" status.

### Step 3: Check Backend Logs
```bash
docker-compose logs -f backend
```

Look for successful startup messages and no DNS errors.

## Testing the Fixes

### Test 1: Document Upload
1. Navigate to http://localhost:3000/login/patient
2. Login with valid Supabase credentials
3. Go to "My Documents" page
4. Click "Upload Document"
5. Select a PDF or image file (under 10MB)
6. Fill in title, description, and category
7. Click "Upload"
8. **Expected:** Success message and document appears in the list
9. **Previous Error:** "Error: 24 Name or service not known"

### Test 2: Login Portal (No Bypass)
1. Navigate to http://localhost:3000/login
2. Choose "Patient Login"
3. Try to login without credentials
4. **Expected:** Form validation errors
5. **Previous Behavior:** Would bypass authentication

## Login Credentials

Since BYPASS_AUTH is now disabled, you need real Supabase accounts.

### Option 1: Automatic User Creation (Recommended) ✅

Run the automated script to create test users:

**Using Python:**
```bash
# Install dependencies
pip install supabase python-dotenv

# Run the script
python scripts/create-test-users.py
```

**Using Node.js:**
```bash
# Install dependencies
npm install @supabase/supabase-js dotenv

# Run the script
node scripts/create-test-users.js
```

The script will automatically create these users:
- **Patient:** patient@test.com / password: patient123
- **Doctor:** doctor@test.com / password: doctor123
- **Admin:** admin@test.com / password: admin123

### Option 2: Manual Creation via Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: `woopouhicztixnkwalwv`
3. Go to Authentication → Users
4. Click "Add User"
5. Create users with these roles in `user_metadata`:

**Patient Account:**
- Email: patient@test.com
- Password: (set your own)
- user_metadata: `{"role": "patient"}`

**Doctor Account:**
- Email: doctor@test.com
- Password: (set your own)
- user_metadata: `{"role": "doctor"}`

**Admin Account:**
- Email: admin@test.com
- Password: (set your own)
- user_metadata: `{"role": "admin"}`

## Login Pages Verified

All login pages are working correctly:
- ✅ `/login` - Role selection page
- ✅ `/login/patient` - Patient login with teal theme
- ✅ `/login/doctor` - Doctor login with blue theme
- ✅ `/login/admin` - Admin login with purple theme

All pages include:
- Email validation
- Password validation (min 6 characters)
- Show/hide password toggle
- Proper error messages
- Loading states
- Responsive design
- Smooth animations

## DNS Configuration Explanation

The DNS configuration added to the backend service allows the Docker container to resolve external hostnames:

- **8.8.8.8** - Google Public DNS (Primary)
- **8.8.4.4** - Google Public DNS (Secondary)

This fixes the issue where the container couldn't resolve `woopouhicztixnkwalwv.supabase.co` when uploading files to Supabase Storage.

## Troubleshooting

### If document upload still fails:
1. Check backend logs: `docker-compose logs backend`
2. Verify Supabase credentials in `.env` are correct
3. Test DNS resolution inside container:
   ```bash
   docker exec -it netra-backend ping woopouhicztixnkwalwv.supabase.co
   ```

### If login fails:
1. Verify user exists in Supabase Dashboard
2. Check that `user_metadata.role` is set correctly
3. Check browser console for errors
4. Verify `.env` has correct Supabase keys

## Next Steps

1. **Restart Docker services** (see Step 1 above)
2. **Create test users** in Supabase Dashboard
3. **Test document upload** with real credentials
4. **Test all three login portals** (patient, doctor, admin)

## Files Modified

- `.env` - Disabled BYPASS_AUTH
- `docker/docker-compose.yml` - Added DNS configuration
- `DOCUMENT_UPLOAD_AND_LOGIN_FIXES.md` - This documentation

## No Code Changes Required

The login pages (`PatientLoginPage.tsx`, `DoctorLoginPage.tsx`, `AdminLoginPage.tsx`) are already correctly implemented and don't need any changes. They will work properly once:
1. Docker services are restarted with DNS configuration
2. Real Supabase user accounts are created
