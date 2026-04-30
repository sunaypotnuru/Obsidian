# 🚀 Netra-Ai Complete Setup & Testing Guide

**Date:** April 29, 2026  
**Status:** Ready for Testing (Pending Anemia Model)

---

## 📋 System Overview

### Services Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NETRA-AI PLATFORM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (React + Vite)          → Port 3000               │
│  Backend (FastAPI)                → Port 8000               │
│  Redis Cache                      → Port 6379               │
│                                                              │
│  AI Services:                                               │
│  ├─ Anemia Detection              → Port 8001 ❌ BLOCKED    │
│  ├─ Diabetic Retinopathy          → Port 8002 ✅           │
│  ├─ Mental Health                 → Port 8003 ✅           │
│  ├─ Parkinson's Voice             → Port 8004 ✅           │
│  └─ Cataract Detection            → Port 8005 ✅           │
│                                                              │
│  Ollama (deepseek-r1:14b)         → Port 11434 ✅          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Login Credentials

### 1. Patient Account
```
Email: patient@netra-ai.com
Password: Patient@123
Role: Patient
Access: Patient Dashboard, Scans, Appointments, Health Records
```

### 2. Doctor Account
```
Email: doctor@netra-ai.com
Password: Doctor@123
Role: Doctor
Access: Doctor Dashboard, Patient Management, Prescriptions, Scans Review
```

### 3. Admin Account
```
Email: admin@netra-ai.com
Password: Admin@123
Role: Admin
Access: Full System Access, Analytics, User Management, System Settings
```

**Note:** These are test accounts. In production, use strong passwords and enable 2FA.

---

## 🌐 Localhost URLs

### Main Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs
- **API Redoc:** http://localhost:8000/redoc

### AI Services
- **Anemia Detection:** http://localhost:8001 ❌ (Waiting for model)
- **Diabetic Retinopathy:** http://localhost:8002
- **Mental Health:** http://localhost:8003
- **Parkinson's Voice:** http://localhost:8004
- **Cataract Detection:** http://localhost:8005

### Health Check Endpoints
- **Backend Health:** http://localhost:8000/health
- **Anemia Health:** http://localhost:8001/health
- **DR Health:** http://localhost:8002/health
- **Mental Health:** http://localhost:8003/health
- **Parkinson's Health:** http://localhost:8004/health
- **Cataract Health:** http://localhost:8005/health

### Database & Cache
- **Redis:** localhost:6379
- **Supabase:** https://woopouhicztixnkwalwv.supabase.co

---

## 🚀 Quick Start Commands

### Option 1: Docker Compose (Recommended)
```bash
# Navigate to project root
cd "C:\Netra Ai\Netra-Ai"

# Stop any running containers
docker stop $(docker ps -aq)

# Remove old containers (optional)
docker rm $(docker ps -aq)

# Build and start all services
docker-compose -f docker/docker-compose.yml up -d --build

# Check service status
docker-compose -f docker/docker-compose.yml ps

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop all services
docker-compose -f docker/docker-compose.yml down
```

### Option 2: Individual Services (Development)

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Access: http://localhost:5173 (Vite dev server)
```

**Backend:**
```bash
cd backend/core
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Access: http://localhost:8000
```

**AI Services:**
```bash
# Anemia Detection
cd backend/anemia
pip install -r requirements.txt
python api.py
# Access: http://localhost:8001

# Diabetic Retinopathy
cd backend/diabetic-retinopathy
pip install -r requirements.txt
python app/main.py
# Access: http://localhost:8002

# Mental Health
cd backend/mental-health
pip install -r requirements.txt
python app/main.py
# Access: http://localhost:8003

# Parkinson's Voice
cd backend/parkinsons-voice
pip install -r requirements.txt
python app/main.py
# Access: http://localhost:8004

# Cataract Detection
cd backend/cataract
pip install -r requirements.txt
python app/main.py
# Access: http://localhost:8005
```

---

## ✅ Pre-Deployment Checklist

### Environment Setup
- [x] `.env` file configured with all required variables
- [x] Supabase credentials set
- [x] BYPASS_AUTH=true for testing
- [x] All API keys configured (Gemini, Twilio, SendGrid)

### Model Files
- [x] Cataract Detection model present
- [x] Diabetic Retinopathy models present (2 models)
- [x] Parkinson's Voice model present
- [x] Mental Health using pre-trained models
- [ ] **Anemia Detection model MISSING** ❌ CRITICAL

### Docker Images
- [ ] Backend image built
- [ ] Frontend image built
- [ ] Anemia service image built
- [ ] DR service image built
- [ ] Mental Health service image built
- [ ] Parkinson's service image built
- [ ] Cataract service image built

### Network & Ports
- [ ] Port 3000 available (Frontend)
- [ ] Port 8000 available (Backend)
- [ ] Ports 8001-8005 available (AI Services)
- [ ] Port 6379 available (Redis)
- [ ] Port 11434 available (Ollama)

---

## 🧪 Testing Procedures

### 1. Health Check Tests

**Test all service health endpoints:**
```bash
# Backend
curl http://localhost:8000/health

# Anemia Detection
curl http://localhost:8001/health

# Diabetic Retinopathy
curl http://localhost:8002/health

# Mental Health
curl http://localhost:8003/health

# Parkinson's Voice
curl http://localhost:8004/health

# Cataract Detection
curl http://localhost:8005/health
```

**Expected Response:**
```json
{
  "status": "healthy" | "ok",
  "service": "service-name",
  "timestamp": "2026-04-29T..."
}
```

### 2. Frontend Tests

**Access Points:**
1. **Home Page:** http://localhost:3000
   - Check hero section loads
   - Verify animations work
   - Test navigation menu

2. **Login Page:** http://localhost:3000/login
   - Test patient login
   - Test doctor login
   - Test admin login

3. **Dashboard:** http://localhost:3000/dashboard
   - Verify role-based access
   - Check data loading
   - Test navigation

4. **Animation Demo:** http://localhost:3000/animation-demo
   - Verify all animations work
   - Check performance (60fps)
   - Test reduced motion preference

### 3. Backend API Tests

**Using Swagger UI:** http://localhost:8000/docs

**Test Endpoints:**
1. **Authentication:**
   - POST `/auth/login`
   - POST `/auth/register`
   - GET `/auth/me`

2. **User Management:**
   - GET `/users/me`
   - PUT `/users/me`
   - GET `/users/{id}`

3. **Appointments:**
   - GET `/appointments`
   - POST `/appointments`
   - PUT `/appointments/{id}`
   - DELETE `/appointments/{id}`

4. **Scans:**
   - GET `/scans`
   - POST `/scans`
   - GET `/scans/{id}`

### 4. AI Service Tests

**Diabetic Retinopathy:**
```bash
curl -X POST http://localhost:8002/predict \
  -F "file=@path/to/retinal_image.jpg"
```

**Mental Health:**
```bash
curl -X POST http://localhost:8003/analyze \
  -F "file=@path/to/audio_recording.webm"
```

**Parkinson's Voice:**
```bash
curl -X POST http://localhost:8004/analyze \
  -F "file=@path/to/voice_recording.wav"
```

**Cataract Detection:**
```bash
curl -X POST http://localhost:8005/predict \
  -F "file=@path/to/eye_image.jpg"
```

**Anemia Detection (After model is added):**
```bash
curl -X POST http://localhost:8001/predict \
  -F "file=@path/to/conjunctiva_image.jpg"
```

### 5. Integration Tests

**End-to-End Flow:**
1. Register new patient account
2. Login as patient
3. Book appointment with doctor
4. Upload scan image
5. View scan results
6. Check notifications
7. Logout

**Doctor Flow:**
1. Login as doctor
2. View appointments
3. Review patient scans
4. Create prescription
5. Send follow-up
6. Logout

**Admin Flow:**
1. Login as admin
2. View analytics dashboard
3. Manage users
4. View system logs
5. Configure settings
6. Logout

---

## 🐛 Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

**2. Docker Build Fails**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose -f docker/docker-compose.yml build --no-cache
```

**3. Frontend Not Loading**
```bash
# Clear node_modules and reinstall
cd frontend
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

**4. Backend API Errors**
```bash
# Check logs
docker logs netra-backend

# Restart service
docker restart netra-backend
```

**5. AI Service Not Responding**
```bash
# Check if model file exists
Test-Path backend/anemia/models/best_enhanced.h5

# Check service logs
docker logs netra-anemia-service
```

**6. Database Connection Issues**
```bash
# Verify Supabase credentials in .env
# Check SUPABASE_URL and SUPABASE_KEY

# Test connection
curl https://woopouhicztixnkwalwv.supabase.co/rest/v1/
```

---

## 📊 Performance Benchmarks

### Expected Performance

**Frontend:**
- Initial Load: < 3s
- Page Transitions: < 500ms
- Animations: 60fps
- Bundle Size: < 2MB (gzipped)

**Backend:**
- API Response Time: < 200ms
- Health Check: < 50ms
- Database Query: < 100ms

**AI Services:**
- Anemia Detection: 2-5s per image
- Diabetic Retinopathy: 3-7s per image
- Mental Health: 10-30s per audio (CPU), 2-5s (GPU)
- Parkinson's Voice: 5-10s per audio
- Cataract Detection: 3-7s per image

---

## 🔒 Security Checklist

### Development Environment
- [x] BYPASS_AUTH=true (for testing only)
- [x] Test credentials documented
- [x] CORS configured for localhost
- [ ] HTTPS not required (localhost)

### Production Environment (Future)
- [ ] BYPASS_AUTH=false
- [ ] Strong passwords enforced
- [ ] 2FA enabled
- [ ] HTTPS required
- [ ] CORS restricted to production domain
- [ ] API rate limiting enabled
- [ ] Secrets in environment variables
- [ ] Database backups configured
- [ ] Monitoring and alerting setup

---

## 📝 Known Issues & Limitations

### Current Blockers
1. **Anemia Detection Model Missing** ❌
   - Status: Waiting for `best_enhanced.h5` from team
   - Impact: Anemia detection feature unavailable
   - Priority: CRITICAL

### Known Limitations
1. **Mental Health Analysis (CPU)**
   - deepseek-r1:14b is slow on CPU (~30-60s)
   - Will be faster on RTX 4060 (~5-10s)

2. **Docker Build Time**
   - Initial build takes 10-15 minutes
   - Subsequent builds are faster (cached layers)

3. **Frontend Node Modules**
   - Large size (~500MB)
   - Excluded from Docker build via .dockerignore

---

## 🎯 Testing Priorities

### Priority 1: Critical Features
1. User authentication (login/register)
2. Dashboard loading
3. AI service health checks
4. Database connectivity

### Priority 2: Core Features
1. Appointment booking
2. Scan upload and processing
3. Results display
4. Notifications

### Priority 3: Secondary Features
1. Animations and UI polish
2. Performance optimization
3. Error handling
4. Edge cases

---

## 📞 Support & Resources

### Documentation
- **Main README:** `README.md`
- **Animation System:** `ANIMATION_README.md`
- **Model Status:** `MODEL_STATUS_UPDATED.md`
- **API Documentation:** http://localhost:8000/docs

### Logs Location
- **Docker Logs:** `docker logs <container-name>`
- **Frontend Logs:** Browser console
- **Backend Logs:** `backend/core/logs/`
- **AI Service Logs:** `backend/<service>/logs/`

### Quick Commands
```bash
# View all container logs
docker-compose -f docker/docker-compose.yml logs

# View specific service logs
docker logs netra-backend -f

# Check container status
docker ps -a

# Restart all services
docker-compose -f docker/docker-compose.yml restart

# Stop all services
docker-compose -f docker/docker-compose.yml down
```

---

## ✅ Final Checklist Before Testing

### Pre-Testing
- [ ] All Docker containers running
- [ ] All health checks passing
- [ ] Frontend accessible at http://localhost:3000
- [ ] Backend API accessible at http://localhost:8000
- [ ] Test credentials ready

### During Testing
- [ ] Test all three user roles (Patient, Doctor, Admin)
- [ ] Test all AI services (except Anemia)
- [ ] Test animations and UI
- [ ] Test mobile responsiveness
- [ ] Check browser console for errors
- [ ] Monitor API response times

### Post-Testing
- [ ] Document any bugs found
- [ ] Note performance issues
- [ ] List missing features
- [ ] Provide feedback on UX
- [ ] Test on different browsers

---

## 🚀 Ready to Test!

**Status:** System is ready for testing (except Anemia Detection)

**Next Steps:**
1. Start all Docker services
2. Access frontend at http://localhost:3000
3. Login with test credentials
4. Test all features
5. Report any issues

**Waiting For:**
- Anemia Detection model file (`best_enhanced.h5`)

---

**Last Updated:** April 29, 2026  
**Version:** 1.0.0  
**Status:** Ready for Testing ✅
