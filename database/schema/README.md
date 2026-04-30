# Database Infrastructure

This folder contains database schemas and deployment scripts for NetraAI.

---

## 📁 Files

### Schema Files
- **`MASTER_DATABASE_SCHEMA.sql`** - Complete database schema with all tables, indexes, and functions
  - Includes a minimal Supabase-compatible `auth` schema for plain PostgreSQL

### Deployment Scripts
- **`deploy.ps1`** - PowerShell deployment script
- **`scripts/reset_db_docker.ps1`** - Drop+recreate Docker Postgres DB and re-apply schema

---

## 🚀 Quick Start

### Using Supabase (Recommended)

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy and paste `MASTER_DATABASE_SCHEMA.sql`
4. Click "Run"

### Using Local PostgreSQL

```bash
# Deploy full schema
psql -U postgres -d netraai -f MASTER_DATABASE_SCHEMA.sql

# Or use the deployment script
./deploy.ps1
```

---

## 📊 Database Schema

The schema includes:
- **User Management** - Patients, doctors, admin profiles
- **Appointments** - Scheduling and management
- **Medical Records** - Scans, prescriptions, lab results
- **Messaging** - Secure communication
- **AI Analysis** - ML model results and tracking
- **Compliance** - Audit logs, HIPAA compliance
- **FHIR** - Healthcare interoperability standards

---

## 🔧 Maintenance

### Backup
```bash
pg_dump -U postgres netraai > backup.sql
```

### Restore
```bash
psql -U postgres -d netraai < backup.sql
```

### Migrations
Use the migration script for schema updates:
```bash
./migrate-to-consolidated-schema.sh
```

---

## 📝 Notes

- All schemas are designed for HIPAA compliance
- Includes Row Level Security (RLS) policies
- Optimized indexes for performance
- Audit logging enabled by default

---

**For production deployment, ensure proper security configurations and backups are in place.**
