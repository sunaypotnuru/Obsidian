# Railway Deployment Guide

## Why Railway?
- ✅ Supports both frontend AND backend
- ✅ Docker support for Python AI services
- ✅ PostgreSQL database included
- ✅ Multiple services in one project
- ✅ Free tier: $5/month credit
- ✅ Easy environment variables management

## Project Structure on Railway

You'll deploy 7 services:

1. **Frontend** (React/Vite)
2. **Backend Core** (FastAPI)
3. **Anemia Detection** (Python/Docker)
4. **Cataract Detection** (Python/Docker)
5. **Diabetic Retinopathy** (Python/Docker)
6. **Parkinson's Voice** (Python/Docker)
7. **Mental Health** (Python/Docker)
8. **PostgreSQL Database** (Railway managed)

## Step-by-Step Deployment

### 1. Create Railway Account
- Go to https://railway.app
- Sign up with GitHub
- Connect your repository: `sunaypotnuru/Obsidian`

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose `sunaypotnuru/Obsidian`

### 3. Deploy Frontend

**Service Name:** `frontend`

**Settings:**
- Root Directory: `frontend`
- Build Command: `npm run build`
- Start Command: `npx serve -s dist -l $PORT`
- Install Command: `npm install`

**Environment Variables:**
```
PORT=3000
NODE_ENV=production
VITE_API_BASE_URL=https://your-backend-core.railway.app
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_LIVEKIT_URL=your_livekit_url
```

### 4. Deploy Backend Core

**Service Name:** `backend-core`

**Settings:**
- Root Directory: `backend/core`
- Dockerfile Path: `backend/core/Dockerfile` (if exists)
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Environment Variables:**
```
PORT=8000
DATABASE_URL=${{Postgres.DATABASE_URL}}
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
```

### 5. Deploy AI Services

For each AI service (anemia, cataract, diabetic-retinopathy, parkinsons-voice, mental-health):

**Service Name:** `anemia-detection` (repeat for each)

**Settings:**
- Root Directory: `backend/anemia`
- Dockerfile: Railway will auto-detect
- Port: `8000` (or service-specific port)

**Environment Variables:**
```
PORT=8000
MODEL_PATH=/app/models
```

### 6. Add PostgreSQL Database

- Click "New" → "Database" → "PostgreSQL"
- Railway will create and link it automatically
- Database URL will be available as `${{Postgres.DATABASE_URL}}`

### 7. Link Services

In each backend service, add environment variables pointing to other services:
```
ANEMIA_SERVICE_URL=${{anemia-detection.RAILWAY_PUBLIC_DOMAIN}}
CATARACT_SERVICE_URL=${{cataract-detection.RAILWAY_PUBLIC_DOMAIN}}
DR_SERVICE_URL=${{diabetic-retinopathy.RAILWAY_PUBLIC_DOMAIN}}
PARKINSONS_SERVICE_URL=${{parkinsons-voice.RAILWAY_PUBLIC_DOMAIN}}
MENTAL_HEALTH_SERVICE_URL=${{mental-health.RAILWAY_PUBLIC_DOMAIN}}
```

## Quick Deploy (Alternative)

### Option 1: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy all services
railway up
```

### Option 2: Deploy Button

Add this to your README.md:

```markdown
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)
```

## Cost Estimation

**Free Tier:**
- $5/month credit
- Enough for development/testing

**Paid (if needed):**
- ~$5-10/month for small traffic
- ~$20-50/month for moderate traffic

## Post-Deployment

1. **Get Frontend URL:** `https://your-frontend.railway.app`
2. **Update CORS:** Add frontend URL to backend CORS settings
3. **Test APIs:** Use frontend URL to test all services
4. **Monitor:** Check Railway dashboard for logs and metrics

## Troubleshooting

**Build fails:**
- Check logs in Railway dashboard
- Verify Dockerfile paths
- Check environment variables

**Service can't connect:**
- Verify service URLs in environment variables
- Check network settings (Railway services can communicate internally)

**Out of memory:**
- Upgrade Railway plan
- Optimize Docker images
- Reduce model sizes

## Alternative: Deploy Frontend Only on Railway

If you want to keep backend elsewhere:
1. Deploy only frontend service
2. Point `VITE_API_BASE_URL` to your backend URL
3. Much simpler and cheaper

---

**Ready to deploy?** Start with frontend first, then add backend services one by one.
