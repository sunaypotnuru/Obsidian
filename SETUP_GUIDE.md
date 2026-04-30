# 🏥 NetraAI — Team Setup Guide
> Last updated: April 2026 | Version 2.0.0

This guide walks any team member from a fresh clone to a fully running local development environment.

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the Repository](#2-clone-the-repository)
3. [Environment Configuration](#3-environment-configuration)
4. [Running with Docker (Recommended)](#4-running-with-docker-recommended)
5. [Local Development (Without Docker)](#5-local-development-without-docker)
6. [Demo Login Credentials](#6-demo-login-credentials)
7. [Project Structure](#7-project-structure)
8. [Common Commands](#8-common-commands)
9. [Troubleshooting](#9-troubleshooting)
10. [Architecture Overview](#10-architecture-overview)

---

## 1. Prerequisites

Install the following tools before cloning:

| Tool | Version | Download |
|------|---------|----------|
| **Git** | Latest | https://git-scm.com |
| **Docker Desktop** | 4.x+ | https://www.docker.com/products/docker-desktop |
| **Node.js** | 18.x or 20.x | https://nodejs.org (for local dev only) |
| **Python** | 3.11+ | https://python.org (for local dev only) |

> **Note:** For the quickest setup, only Docker Desktop is required. Node.js and Python are only needed if you plan to run services directly on your machine.

---

## 2. Clone the Repository

```bash
git clone https://github.com/YOUR_ORG/netra-ai.git
cd netra-ai
```

---

## 3. Environment Configuration

### Step 1 — Copy the example env file

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

### Step 2 — Fill in your credentials

Open `.env` in a text editor and replace the placeholder values:

```env
# ── BYPASS MODE (Quick demo without Supabase) ───────────────────
# Set both to "true" for local demos; NEVER use true in production
BYPASS_AUTH=true
VITE_BYPASS_AUTH=true

# ── SUPABASE (Production database & auth) ───────────────────────
# Get from: https://supabase.com → your project → Settings → API
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_KEY=YOUR_ANON_KEY
SUPABASE_JWT_SECRET=YOUR_JWT_SECRET

VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# ── LIVEKIT (Video consultations) ───────────────────────────────
# Get from: https://livekit.io → your project
LIVEKIT_API_KEY=YOUR_LIVEKIT_API_KEY
LIVEKIT_API_SECRET=YOUR_LIVEKIT_API_SECRET
LIVEKIT_URL=wss://YOUR_PROJECT.livekit.cloud
VITE_LIVEKIT_URL=wss://YOUR_PROJECT.livekit.cloud

# ── GOOGLE GEMINI AI ─────────────────────────────────────────────
# Get from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

> **Quick Demo:** To skip Supabase setup entirely, set `BYPASS_AUTH=true` and `VITE_BYPASS_AUTH=true`. This enables demo login mode (see [Demo Credentials](#6-demo-login-credentials)).

---

## 4. Running with Docker (Recommended)

This is the **fastest** way to get the full stack running.

### Start Core Services (Frontend + Backend + Redis)

```powershell
docker-compose -f docker/docker-compose.yml --env-file .env up -d frontend backend redis
```

### Start All Services (including AI/ML models)

```powershell
docker-compose -f docker/docker-compose.yml --env-file .env up -d
```

### Force Rebuild After Code Changes

```powershell
docker-compose -f docker/docker-compose.yml --env-file .env up -d --build frontend backend
```

### Check Service Status

```powershell
docker-compose -f docker/docker-compose.yml ps
```

### View Logs

```powershell
# All services
docker-compose -f docker/docker-compose.yml logs -f

# Specific service
docker logs netra-frontend -f
docker logs netra-backend -f
```

### Stop All Services

```powershell
docker-compose -f docker/docker-compose.yml down
```

---

### Service URLs (after startup)

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | http://localhost:3000 | Main web application |
| **Backend API** | http://localhost:8000 | FastAPI REST API |
| **API Docs** | http://localhost:8000/docs | Swagger/OpenAPI interactive docs |
| **Health Check** | http://localhost:8000/health | Backend health status |
| **Redis** | localhost:6379 | Cache (no web UI by default) |
| **Anemia ML** | http://localhost:8001 | Anemia detection service |
| **Diabetic Retinopathy ML** | http://localhost:8002 | DR detection service |
| **Mental Health ML** | http://localhost:8003 | Mental health AI |
| **Parkinson's Voice ML** | http://localhost:8004 | Voice analysis service |
| **Cataract ML** | http://localhost:8005 | Cataract detection service |

---

## 5. Local Development (Without Docker)

Use this for faster hot-reload development.

### Frontend

```powershell
cd frontend
npm install        # First time only
npm run dev        # Starts on http://localhost:5173
```

### Backend

```powershell
cd backend/core
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Redis (required for backend)

```powershell
# Easiest: run Redis in Docker while doing local backend dev
docker run -d -p 6379:6379 redis:7-alpine
```

---

## 6. Demo Login Credentials

> These only work when `VITE_BYPASS_AUTH=true` is set in your `.env` (or when the Docker build was done with bypass enabled).

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@test.com` | any password |
| **Doctor** | `doctor@test.com` | any password |
| **Patient** | `patient@test.com` | any password |

**Special email mappings (for real accounts):**

| Email | Auto-assigned Role |
|-------|--------------------|
| `sunaypotnuru@gmail.com` | Admin |
| `rohithpanduru8@gmail.com` | Doctor |
| `sunaysujsy@gmail.com` | Patient |

> **Portal Login Pages:**
> - Patient: http://localhost:3000/login/patient
> - Doctor: http://localhost:3000/login/doctor
> - Admin: http://localhost:3000/login/admin

---

## 7. Project Structure

```
netra-ai/
├── frontend/                  # React + TypeScript (Vite)
│   ├── src/app/
│   │   ├── pages/             # Page components
│   │   │   ├── admin/         # Admin-only pages
│   │   │   ├── doctor/        # Doctor-only pages
│   │   │   ├── patient/       # Patient-only pages
│   │   │   └── public/        # Public pages (no auth)
│   │   ├── components/        # Shared UI components
│   │   │   ├── VoiceAccessibility.tsx  # Global voice reader
│   │   │   └── ChatbotWidget.tsx       # AI chatbot (patient only)
│   │   ├── routes.tsx          # All route definitions
│   │   └── App.tsx             # Root application
│   └── src/lib/
│       ├── store.ts            # Zustand auth store
│       ├── accessibility.ts   # Global accessibility state
│       └── api.ts             # API client
│
├── backend/
│   ├── core/                  # Main FastAPI backend (port 8000)
│   │   └── app/routes/        # API route handlers
│   ├── anemia/                # Anemia detection ML service (port 8001)
│   ├── diabetic-retinopathy/  # DR detection ML service (port 8002)
│   ├── mental-health/         # Mental health AI (port 8003)
│   ├── parkinsons-voice/      # Voice analysis (port 8004)
│   └── cataract/              # Cataract detection (port 8005)
│
├── database/                  # SQL schemas and migrations
├── docker/
│   └── docker-compose.yml     # All service definitions
├── docs/                      # Additional documentation
├── .env.example               # Environment variable template
└── SETUP_GUIDE.md             # This file
```

---

## 8. Common Commands

### Docker

```powershell
# Rebuild only the frontend (after UI changes)
docker-compose -f docker/docker-compose.yml --env-file .env up -d --build frontend

# Rebuild only the backend (after API changes)
docker-compose -f docker/docker-compose.yml --env-file .env up -d --build backend

# Restart a specific service (no rebuild)
docker-compose -f docker/docker-compose.yml restart frontend

# Remove all containers and volumes (full reset)
docker-compose -f docker/docker-compose.yml down -v

# Check container health
docker ps --filter name=netra
```

### Frontend (local)

```powershell
cd frontend
npm run dev          # Start dev server with hot reload
npm run build        # Production build (check for errors)
npm run type-check   # TypeScript type checking only
npm run test         # Run unit tests
npm run test:e2e     # Run Playwright end-to-end tests
```

### Backend (local)

```powershell
cd backend/core
python -m pytest     # Run backend tests
uvicorn app.main:app --reload  # Dev server
```

---

## 9. Troubleshooting

### ❌ IDE shows "Cannot find module 'react'" errors

**Cause:** `node_modules` not installed locally (IDE TypeScript server needs them even when using Docker).

**Fix:**
```powershell
cd frontend
npm install
```
Then restart your IDE's TypeScript server (VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server").

---

### ❌ Docker warns about missing VITE_ variables

```
level=warning msg="The "VITE_SUPABASE_URL" variable is not set."
```

**Cause:** Running Docker without `--env-file .env`.

**Fix:** Always include `--env-file .env` in your commands:
```powershell
docker-compose -f docker/docker-compose.yml --env-file .env up -d
```

---

### ❌ Frontend container fails health check (backend unhealthy)

**Cause:** Backend failed to start (usually Supabase credentials issue or port conflict).

**Fix:**
```powershell
# Check what's wrong
docker logs netra-backend

# If it's a credentials issue, verify your .env has valid Supabase keys
# OR enable bypass mode for local testing:
# BYPASS_AUTH=true
# VITE_BYPASS_AUTH=true
```

---

### ❌ Port 3000 or 8000 already in use

```powershell
# Find and kill the process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_FROM_ABOVE> /F
```

---

### ❌ Login shows "Failed to connect" with Supabase

**Option A — Use Bypass Auth (for local dev/demos):**
Set `VITE_BYPASS_AUTH=true` in your `.env`, then rebuild:
```powershell
docker-compose -f docker/docker-compose.yml --env-file .env up -d --build frontend
```

**Option B — Fix Supabase credentials:**
Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` match your Supabase project settings.

---

### ❌ Voice Reader doesn't work

The Voice Reader uses the browser's Web Speech API. Ensure:
1. You're using a **Chromium-based browser** (Chrome, Edge, Brave)
2. For non-English languages: the language pack must be installed in your OS
   - **Windows:** Settings → Time & Language → Language → Add a language
   - **macOS:** System Settings → General → Language & Region → Preferred Languages

---

## 10. Architecture Overview

```
Browser
  │
  ▼
Frontend (React + Vite)          ← Port 3000
  │  Bypasses Supabase when
  │  VITE_BYPASS_AUTH=true
  │
  ├──→ Supabase (Auth + DB)      ← External (cloud)
  │
  └──→ Backend API (FastAPI)     ← Port 8000
         │
         ├──→ Redis (Cache)      ← Port 6379
         ├──→ Supabase DB        ← External (cloud)
         ├──→ Gemini AI          ← External (cloud)
         ├──→ LiveKit (Video)    ← External (cloud)
         │
         ├──→ Anemia ML          ← Port 8001 (Docker)
         ├──→ DR Detection ML    ← Port 8002 (Docker)
         ├──→ Mental Health ML   ← Port 8003 (Docker)
         ├──→ Parkinson's ML     ← Port 8004 (Docker)
         └──→ Cataract ML        ← Port 8005 (Docker)
```

### Role-Based Access

| Role | Portal | Features |
|------|--------|----------|
| **Patient** | `/patient/*` | AI scans, appointments, chatbot, voice reader |
| **Doctor** | `/doctor/*` | Patient management, prescriptions, voice reader |
| **Admin** | `/admin/*` | Platform management, analytics, compliance |

> **Note:** The Voice Reader and Chatbot are strictly restricted from the Admin portal. Admin accounts are excluded from the clinical Doctors directory visible to patients.

---

## 📞 Support

For questions or issues, contact the development team:
- **Lead Developer:** Sunay Potnuru — sunaypotnuru@gmail.com
- **GitHub Issues:** https://github.com/YOUR_ORG/netra-ai/issues

---

*NetraAI — AI-Powered Telemedicine Platform*
