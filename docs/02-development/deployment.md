# 🚀 Deployment Guide

Complete guide for deploying Netra AI to production.

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Database Setup](#-database-setup)
- [Backend Deployment](#-backend-deployment)
- [Frontend Deployment](#-frontend-deployment)
- [AI Services Deployment](#-ai-services-deployment)
- [Environment Configuration](#-environment-configuration)
- [Verification](#-verification)
- [Troubleshooting](#-troubleshooting)

---

## 🔧 Prerequisites

### Required Software
- **Python**: 3.11+
- **Node.js**: 18+
- **Docker**: 20.10+
- **PostgreSQL**: 14+ (Supabase recommended)
- **Git**: Latest version

### Required Accounts
- **Supabase**: Database hosting (free tier available)
- **Vercel/Netlify**: Frontend hosting
- **Railway/Render**: Backend hosting
- **Docker Hub**: Container registry (optional)

### System Requirements
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 20GB free space
- **CPU**: 4 cores minimum
- **GPU**: Optional (for AI model inference)

---

## 🗄️ Database Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: `netra-ai-production`
   - Database Password: (strong password)
   - Region: (closest to your users)
4. Wait for project creation (~2 minutes)

### Step 2: Get Connection Details

1. Go to Project Settings → Database
2. Note down:
   - **Project URL**: `https://[project-ref].supabase.co`
   - **API Key (anon)**: For client-side access
   - **API Key (service_role)**: For server-side access
   - **Database Password**: From step 1
   - **Connection String**: For direct database access

### Step 3: Run Database Migration

**Option A: Using Supabase SQL Editor**
1. Go to SQL Editor in Supabase dashboard
2. Create new query
3. Copy content from `infrastructure/database/MASTER_DATABASE_SCHEMA.sql`
4. Run query
5. Verify tables created

**Option B: Using psql**
```bash
# Connect to Supabase PostgreSQL
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run master schema
\i infrastructure/database/MASTER_DATABASE_SCHEMA.sql

# Verify tables
\dt

# Exit
\q
```

### Step 4: Enable Row Level Security (RLS)

The schema automatically enables RLS. Verify:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.

---

## 🔙 Backend Deployment

### Option 1: Docker Deployment (Recommended)

**Step 1: Build Docker Images**
```bash
cd Netra-Ai

# Build all services
docker-compose build

# Or build specific service
docker build -t netra-backend ./services/core
docker build -t netra-cataract ./services/cataract
```

**Step 2: Push to Registry**
```bash
# Tag images
docker tag netra-backend:latest your-registry/netra-backend:latest
docker tag netra-cataract:latest your-registry/netra-cataract:latest

# Push to registry
docker push your-registry/netra-backend:latest
docker push your-registry/netra-cataract:latest
```

**Step 3: Deploy**
```bash
# Pull and run on production server
docker-compose -f docker-compose.yml up -d
```

---

### Option 2: Railway Deployment

**Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
railway login
```

**Step 2: Create New Project**
```bash
railway init
railway link
```

**Step 3: Deploy Backend**
```bash
cd services/core
railway up
```

**Step 4: Add Environment Variables**
```bash
railway variables set SUPABASE_URL="your-url"
railway variables set SUPABASE_KEY="your-key"
```

---

### Option 3: Render Deployment

**Step 1: Create Web Service**
1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repository
4. Configure:
   - **Name**: netra-backend
   - **Environment**: Python 3.11
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Step 2: Add Environment Variables**
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- `ENVIRONMENT=production`

---

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Deploy**
```bash
cd apps/web
vercel --prod
```

**Step 3: Configure Environment Variables**
In Vercel dashboard:
- `VITE_API_URL`: Your backend URL
- `VITE_SUPABASE_URL`: Your Supabase URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

---

### Option 2: Netlify

**Step 1: Build**
```bash
cd apps/web
npm run build
```

**Step 2: Deploy**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**Step 3: Configure**
- Build command: `npm run build`
- Publish directory: `dist`
- Add environment variables

---

### Option 3: Static Hosting (S3, CloudFlare Pages)

**Step 1: Build**
```bash
cd apps/web
npm run build
```

**Step 2: Upload**
Upload `dist/` folder to your hosting provider.

**Step 3: Configure**
- Enable SPA routing (redirect all to index.html)
- Set up custom domain
- Enable HTTPS

---

## 🤖 AI Services Deployment

### Deploy Each AI Service

Each AI service can be deployed separately:

**Cataract Detection (Port 8005)**
```bash
cd services/cataract
docker build -t netra-cataract .
docker run -p 8005:8005 netra-cataract
```

**DR Detection (Port 8002)**
```bash
cd services/diabetic-retinopathy
docker build -t netra-dr .
docker run -p 8002:8002 netra-dr
```

**Mental Health (Port 8003)**
```bash
cd services/mental-health
docker build -t netra-mental-health .
docker run -p 8003:8003 netra-mental-health
```

**Anemia Detection (Port 8001)**
```bash
cd services/anemia
docker build -t netra-anemia .
docker run -p 8001:8001 netra-anemia
```

**Parkinson's Detection (Port 8004)**
```bash
cd services/parkinsons-voice
docker build -t netra-parkinsons .
docker run -p 8004:8004 netra-parkinsons
```

### GPU Acceleration (Optional)

For faster inference, deploy on GPU instances:

```bash
# Use NVIDIA Docker runtime
docker run --gpus all -p 8005:8005 netra-cataract
```

---

## ⚙️ Environment Configuration

### Backend Environment Variables

Create `.env` file:
```bash
# Supabase
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_KEY=[anon-key]
SUPABASE_SERVICE_KEY=[service-role-key]

# JWT
JWT_SECRET=[random-secret-key]
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Environment
ENVIRONMENT=production
DEBUG=false

# CORS
CORS_ORIGINS=https://your-frontend-domain.com

# AI Services
CATARACT_SERVICE_URL=http://cataract:8005
DR_SERVICE_URL=http://dr:8002
ANEMIA_SERVICE_URL=http://anemia:8001
MENTAL_HEALTH_SERVICE_URL=http://mental-health:8003
PARKINSONS_SERVICE_URL=http://parkinsons:8004

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Storage (Optional)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET_NAME=netra-ai-uploads
AWS_REGION=us-east-1
```

### Frontend Environment Variables

Create `.env.production`:
```bash
VITE_API_URL=https://api.your-domain.com
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
VITE_ENVIRONMENT=production
```

---

## ✅ Verification

### Step 1: Health Checks

**Backend:**
```bash
curl https://api.your-domain.com/health
# Expected: {"status":"ok","version":"4.0.0"}
```

**AI Services:**
```bash
curl https://cataract.your-domain.com/health
curl https://dr.your-domain.com/health
curl https://anemia.your-domain.com/health
curl https://mental-health.your-domain.com/health
curl https://parkinsons.your-domain.com/health
```

### Step 2: Database Connection

```bash
curl https://api.your-domain.com/api/v1/health
# Should return database connection status
```

### Step 3: Frontend Access

1. Open https://your-domain.com
2. Verify homepage loads
3. Test registration
4. Test login
5. Test AI detection

### Step 4: End-to-End Test

1. Register new account
2. Upload test image
3. Run AI detection
4. Verify results
5. Check database for records

---

## 🐛 Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to Supabase
```bash
# Check connection string
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Verify IP whitelist in Supabase settings
# Add your server IP to allowed list
```

### Backend Not Starting

**Problem**: Backend crashes on startup
```bash
# Check logs
docker logs netra-backend

# Common issues:
# 1. Missing environment variables
# 2. Database connection failed
# 3. Port already in use
```

### AI Service Errors

**Problem**: AI model not loading
```bash
# Check model files exist
ls -lh services/cataract/models/

# Check memory usage
docker stats

# Increase memory limit
docker run -m 4g netra-cataract
```

### Frontend Build Errors

**Problem**: Build fails
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build

# Check environment variables
cat .env.production
```

### CORS Errors

**Problem**: Frontend can't access backend
```bash
# Update CORS_ORIGINS in backend .env
CORS_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# Restart backend
docker-compose restart backend
```

---

## 📊 Production Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database schema applied
- [ ] SSL certificates ready
- [ ] Domain names configured
- [ ] Backup strategy in place

### Deployment
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] AI services deployed and responding
- [ ] Database connected
- [ ] Health checks passing

### Post-Deployment
- [ ] Monitoring configured
- [ ] Logging enabled
- [ ] Alerts set up
- [ ] Backup verified
- [ ] Performance tested
- [ ] Security audit completed

---

## 🔒 Security Considerations

### SSL/TLS
- Use HTTPS for all services
- Enable HSTS headers
- Use strong cipher suites

### Environment Variables
- Never commit .env files
- Use secrets management (AWS Secrets Manager, etc.)
- Rotate keys regularly

### Database
- Enable RLS (Row Level Security)
- Use prepared statements
- Regular backups
- Encrypt sensitive data

### API
- Rate limiting enabled
- Input validation
- Authentication required
- CORS properly configured

---

## 📈 Monitoring

### Recommended Tools
- **Uptime**: UptimeRobot, Pingdom
- **Logs**: Papertrail, Loggly
- **Errors**: Sentry
- **Performance**: New Relic, DataDog
- **Analytics**: Google Analytics, Mixpanel

### Key Metrics
- Response time (< 200ms target)
- Error rate (< 1% target)
- Uptime (99.9% target)
- AI inference time (< 30s target)

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker images
        run: docker-compose build
      
      - name: Push to registry
        run: |
          docker push your-registry/netra-backend
          docker push your-registry/netra-frontend
      
      - name: Deploy to production
        run: |
          ssh user@server 'cd /app && docker-compose pull && docker-compose up -d'
```

---

**Last Updated**: April 23, 2026  
**Version**: 4.0.0  
**Status**: ✅ Production Ready
