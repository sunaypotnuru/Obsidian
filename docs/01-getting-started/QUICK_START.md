# ⚡ Quick Start

Get Netra AI running in 5 minutes.

## 🚀 Setup

### 1. Start Services (2 minutes)
```bash
cd Netra-Ai
docker-compose up -d
```

### 2. Verify Services (1 minute)
```bash
docker ps
```
Expected: 8 containers running

### 3. Access Platform (30 seconds)
Open browser: **http://localhost:3000**

### 4. Create Test Accounts (2 minutes)

**Patient Account:**
- URL: http://localhost:3000/register
- Email: `patient@test.com`
- Password: `Test123!`

**Doctor Account:**
- URL: http://localhost:3000/doctor/register
- Email: `doctor@test.com`
- Password: `Test123!`

---

## 📚 Full Documentation

For complete documentation, see:
- **Getting Started**: `docs/01-getting-started/README.md`
- **Testing Guide**: `docs/02-development/testing-guide.md`
- **Hackathon Prep**: `docs/04-hackathon/README.md`
- **All Docs**: `docs/README.md`

---

## 🔗 Quick Links

### Service URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Test Accounts
- **Doctor**: `doctor@test.com` / `Test123!`
- **Patient**: `patient@test.com` / `Test123!`

---

## 🐛 Troubleshooting

### Services Not Running
```bash
docker-compose down
docker-compose up -d
```

### Check Logs
```bash
docker-compose logs -f
```

### More Help
See: `docs/01-getting-started/README.md#-troubleshooting`

---

**Status**: ✅ Production Ready  
**Version**: 4.0.0
