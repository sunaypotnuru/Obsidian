# 🚀 NETRA AI COMPLIANCE DEPLOYMENT GUIDE

**Version**: 1.0.0  
**Date**: April 23, 2026  
**Status**: Production Ready

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Service Deployment](#service-deployment)
5. [Nginx Configuration](#nginx-configuration)
6. [Monitoring Setup](#monitoring-setup)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 PREREQUISITES

### Required Software
- Docker 24.0+ and Docker Compose 2.20+
- Node.js 18+ and npm 9+
- Python 3.10+
- PostgreSQL 15+ (or use Docker)
- Nginx 1.24+

### System Requirements
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 50GB minimum, 100GB recommended
- **OS**: Linux (Ubuntu 22.04 LTS recommended), macOS, or Windows with WSL2

---

## 🌍 ENVIRONMENT SETUP

### 1. Clone Repository
```bash
git clone https://github.com/your-org/netra-ai.git
cd netra-ai
```

### 2. Create Environment Files

**Main Application (.env)**
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Database
DATABASE_URL=postgresql://netra_admin:your_password@localhost:5432/netra_db
TIMESCALE_DB=netra_compliance
TIMESCALE_USER=netra_admin
TIMESCALE_PASSWORD=your_secure_password

# API URLs
NEXT_PUBLIC_FDA_APM_API=http://localhost:8001
NEXT_PUBLIC_IEC62304_API=http://localhost:8002
NEXT_PUBLIC_SOC2_API=http://localhost:8003

# Grafana
GRAFANA_USER=admin
GRAFANA_PASSWORD=your_secure_password
GRAFANA_ROOT_URL=http://localhost:3001

# GitHub (for SOC 2 evidence collection)
GITHUB_TOKEN=your_github_token

# Authentication
JWT_SECRET=your_jwt_secret_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Install Dependencies

**Frontend**
```bash
cd apps/web
npm install
cd ../..
```

**Python Services**
```bash
cd services/monitoring
pip install -r requirements.txt
cd ../compliance
pip install -r requirements.txt
cd ../..
```

---

## 💾 DATABASE SETUP

### Option 1: Using Docker (Recommended)

```bash
# Start TimescaleDB
docker-compose -f docker-compose.compliance.yml up -d timescaledb

# Wait for database to be ready
docker-compose -f docker-compose.compliance.yml logs -f timescaledb

# Run migrations
cd scripts/database
./migrate-to-consolidated-schema.sh

# Seed compliance data
node seed-compliance-data.ts
```

### Option 2: Manual Setup

```bash
# Install TimescaleDB extension
sudo apt-get install timescaledb-postgresql-15

# Create database
createdb netra_compliance

# Enable TimescaleDB
psql netra_compliance -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"

# Run schema
psql netra_compliance < database/CONSOLIDATED_MASTER_SCHEMA.sql

# Run migrations
cd scripts/database
./migrate-to-consolidated-schema.sh

# Seed data
node seed-compliance-data.ts
```

---

## 🐳 SERVICE DEPLOYMENT

### Using Docker Compose (Recommended)

```bash
# Start all compliance services
docker-compose -f docker-compose.compliance.yml up -d

# Check service status
docker-compose -f docker-compose.compliance.yml ps

# View logs
docker-compose -f docker-compose.compliance.yml logs -f
```

### Manual Deployment

**FDA APM Service**
```bash
cd services/monitoring
uvicorn api:app --host 0.0.0.0 --port 8001 --reload
```

**IEC 62304 Service**
```bash
cd services/compliance
uvicorn iec62304-api:app --host 0.0.0.0 --port 8002 --reload
```

**SOC 2 Service**
```bash
cd services/compliance
uvicorn soc2-api:app --host 0.0.0.0 --port 8003 --reload
```

**Web Application**
```bash
cd apps/web
npm run build
npm run start
```

---

## 🔧 NGINX CONFIGURATION

### 1. Install Nginx
```bash
sudo apt-get update
sudo apt-get install nginx
```

### 2. Copy Configuration
```bash
sudo cp infrastructure/nginx/nginx.conf /etc/nginx/nginx.conf
```

### 3. Test Configuration
```bash
sudo nginx -t
```

### 4. Reload Nginx
```bash
sudo systemctl reload nginx
```

### 5. Enable Nginx on Boot
```bash
sudo systemctl enable nginx
```

---

## 📊 MONITORING SETUP

### 1. Start Monitoring Stack
```bash
docker-compose -f docker-compose.compliance.yml up -d prometheus grafana node-exporter
```

### 2. Access Dashboards

**Prometheus**
- URL: http://localhost:9090
- No authentication by default

**Grafana**
- URL: http://localhost:3001
- Username: admin
- Password: (from .env GRAFANA_PASSWORD)

### 3. Import Grafana Dashboards

1. Login to Grafana
2. Go to Dashboards → Import
3. Upload JSON files from `infrastructure/grafana/dashboards/`
4. Select Prometheus as data source

### 4. Configure Alerts

1. Go to Alerting → Alert rules
2. Review imported alert rules
3. Configure notification channels (email, Slack, PagerDuty)

---

## ✅ VERIFICATION

### 1. Health Checks

**Check all services**
```bash
# Web app
curl http://localhost:3000/health

# FDA APM
curl http://localhost:8001/health

# IEC 62304
curl http://localhost:8002/health

# SOC 2
curl http://localhost:8003/health

# Prometheus
curl http://localhost:9090/-/healthy

# Grafana
curl http://localhost:3001/api/health
```

### 2. Test Compliance APIs

**FDA APM**
```bash
curl http://localhost:8001/models
curl http://localhost:8001/metrics/anemia_detection_model
curl http://localhost:8001/alerts
```

**IEC 62304**
```bash
curl http://localhost:8002/requirements
curl http://localhost:8002/traceability-matrix
curl http://localhost:8002/coverage-stats
```

**SOC 2**
```bash
curl http://localhost:8003/controls
curl http://localhost:8003/evidence
curl http://localhost:8003/statistics
```

### 3. Access Admin Portal

1. Navigate to http://localhost:3000/admin/login
2. Login with admin credentials
3. Navigate to Compliance Dashboard: http://localhost:3000/admin/compliance
4. Verify all metrics are loading
5. Test navigation to:
   - FDA APM Monitoring
   - IEC 62304 Traceability
   - SOC 2 Evidence
   - FHIR Resource Manager
   - System Health

### 4. Test Monitoring

1. Open Prometheus: http://localhost:9090
2. Query: `up` (should show all services as 1)
3. Open Grafana: http://localhost:3001
4. View dashboards
5. Verify metrics are being collected

---

## 🐛 TROUBLESHOOTING

### Service Won't Start

**Check logs**
```bash
docker-compose -f docker-compose.compliance.yml logs [service-name]
```

**Common issues**:
- Port already in use: Change port in docker-compose.yml
- Database connection failed: Check DATABASE_URL in .env
- Permission denied: Run with sudo or fix file permissions

### Database Connection Issues

**Test connection**
```bash
psql postgresql://netra_admin:password@localhost:5433/netra_compliance
```

**Reset database**
```bash
docker-compose -f docker-compose.compliance.yml down -v
docker-compose -f docker-compose.compliance.yml up -d timescaledb
```

### Nginx Issues

**Check configuration**
```bash
sudo nginx -t
```

**View error logs**
```bash
sudo tail -f /var/log/nginx/error.log
```

**Restart Nginx**
```bash
sudo systemctl restart nginx
```

### Prometheus Not Scraping

**Check targets**
- Open http://localhost:9090/targets
- Verify all targets are "UP"
- Check service URLs in prometheus.yml

**Restart Prometheus**
```bash
docker-compose -f docker-compose.compliance.yml restart prometheus
```

### Grafana Dashboard Issues

**Reset admin password**
```bash
docker exec -it netra-grafana grafana-cli admin reset-admin-password newpassword
```

**Check data source**
- Go to Configuration → Data Sources
- Test Prometheus connection
- Verify URL is correct

---

## 🔐 SECURITY CHECKLIST

Before deploying to production:

- [ ] Change all default passwords
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure firewall rules
- [ ] Set up authentication for Prometheus/Grafana
- [ ] Enable rate limiting in Nginx
- [ ] Configure backup strategy
- [ ] Set up log rotation
- [ ] Enable audit logging
- [ ] Configure CORS properly
- [ ] Review and update security headers

---

## 📈 PERFORMANCE TUNING

### Database Optimization
```sql
-- Analyze tables
ANALYZE;

-- Vacuum tables
VACUUM ANALYZE;

-- Create indexes
CREATE INDEX CONCURRENTLY idx_predictions_timestamp ON fda_apm_predictions(timestamp);
CREATE INDEX CONCURRENTLY idx_alerts_model ON fda_apm_alerts(model_name, timestamp);
```

### Nginx Optimization
```nginx
# Increase worker connections
worker_connections 2048;

# Enable caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g;
```

### Application Optimization
- Enable production build: `npm run build`
- Use CDN for static assets
- Enable Redis caching
- Configure connection pooling

---

## 📞 SUPPORT

For issues or questions:
- GitHub Issues: https://github.com/your-org/netra-ai/issues
- Documentation: https://docs.netra-ai.com
- Email: support@netra-ai.com

---

**🎉 DEPLOYMENT COMPLETE - NETRA AI COMPLIANCE SYSTEM IS READY! 🎉**
