# Netra-AI Microservices

**Architecture:** Microservices  
**Framework:** FastAPI  
**Deployment:** Docker containers

---

## 📁 Services Overview

| Service | Port | Status | Accuracy | Description |
|---------|------|--------|----------|-------------|
| **core** | 8000 | ✅ Running | - | Main API, auth, database |
| **anemia** | 8001 | ✅ Deployed | ~90% | Anemia detection from conjunctival images |
| **cataract** | 8002 | ✅ Trained | 95.03% | Cataract detection from fundus images |
| **diabetic-retinopathy** | 8003 | ✅ Trained | ~95% | DR detection and severity grading |
| **parkinsons-voice** | 8004 | ⏳ Training | 85-92% (expected) | Parkinson's detection from voice |
| **mental-health** | 8005 | ✅ Running | - | Mental health assessment |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Netra-AI Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Web    │  │  Mobile  │  │   API    │  │  Admin   │   │
│  │   App    │  │   App    │  │  Docs    │  │  Panel   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │              │              │          │
│       └─────────────┴──────────────┴──────────────┘          │
│                          │                                    │
│                    ┌─────▼─────┐                            │
│                    │   Core    │                            │
│                    │  Service  │                            │
│                    │  (8000)   │                            │
│                    └─────┬─────┘                            │
│                          │                                    │
│       ┌──────────────────┼──────────────────┐               │
│       │                  │                  │               │
│  ┌────▼────┐  ┌─────────▼────────┐  ┌─────▼─────┐         │
│  │ Anemia  │  │    Cataract      │  │    DR     │         │
│  │ (8001)  │  │     (8002)       │  │  (8003)   │         │
│  └─────────┘  └──────────────────┘  └───────────┘         │
│                                                               │
│  ┌──────────────┐  ┌──────────────────────────────┐        │
│  │  Parkinson's │  │    Mental Health             │        │
│  │    (8004)    │  │       (8005)                 │        │
│  └──────────────┘  └──────────────────────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Run All Services

```bash
# Using Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Run Individual Service

```bash
# Navigate to service
cd services/[service-name]

# Install dependencies
pip install -r requirements.txt

# Run service
python -m uvicorn app.main:app --reload --port [PORT]
```

---

## 📋 Service Details

### Core Service (Port 8000)
- **Purpose:** Main API, authentication, database
- **Tech:** FastAPI, PostgreSQL, JWT
- **Features:**
  - User authentication
  - Database management
  - API gateway
  - Health records

### Anemia Detection (Port 8001)
- **Purpose:** Detect anemia from conjunctival images
- **Model:** CNN-based
- **Accuracy:** ~90%
- **Input:** Conjunctival photos
- **Output:** Anemia classification + hemoglobin estimate

### Cataract Detection (Port 8002)
- **Purpose:** Detect cataracts from fundus images
- **Model:** ResNet-50 with attention
- **Accuracy:** 95.03%
- **Input:** Fundus images (224x224)
- **Output:** 3 classes (no_cataract, early, advanced)

### Diabetic Retinopathy (Port 8003)
- **Purpose:** Detect and grade diabetic retinopathy
- **Model:** EfficientNet-B5
- **Accuracy:** ~95%
- **Input:** Retinal fundus images (456x456)
- **Output:** 5 severity levels (0-4)

### Parkinson's Voice (Port 8004)
- **Purpose:** Detect Parkinson's from voice analysis
- **Model:** CNN + LSTM hybrid
- **Expected Accuracy:** 85-92%
- **Input:** Voice audio (sustained "ahhh")
- **Output:** Binary classification (PD vs healthy)
- **Status:** ⏳ Training on RTX 4060

### Mental Health (Port 8005)
- **Purpose:** Mental health assessment
- **Features:** Depression, anxiety screening
- **Input:** Questionnaire responses
- **Output:** Risk assessment and recommendations

---

## 🔧 Development

### Adding a New Service

1. Create service folder:
   ```bash
   mkdir services/new-service
   cd services/new-service
   ```

2. Create structure:
   ```
   new-service/
   ├── app/
   │   └── main.py
   ├── models/
   ├── tests/
   ├── Dockerfile
   ├── requirements.txt
   └── README.md
   ```

3. Implement FastAPI app in `app/main.py`

4. Add to `docker-compose.yml`

5. Update this README

### Testing

```bash
# Run tests for a service
cd services/[service-name]
pytest tests/

# Run all tests
pytest services/*/tests/
```

### Deployment

```bash
# Build all images
docker-compose build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 API Documentation

Each service provides interactive API documentation:

- Core: http://localhost:8000/docs
- Anemia: http://localhost:8001/docs
- Cataract: http://localhost:8002/docs
- DR: http://localhost:8003/docs
- Parkinson's: http://localhost:8004/docs
- Mental Health: http://localhost:8005/docs

---

## 🔐 Environment Variables

Each service requires environment variables:

```bash
# Core service
DATABASE_URL=postgresql://user:pass@localhost/netra
JWT_SECRET=your-secret-key

# AI services
MODEL_PATH=./models/model.pth
DEVICE=cuda  # or cpu
```

See individual service READMEs for specific requirements.

---

## 📈 Monitoring

### Health Checks

```bash
# Check all services
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
curl http://localhost:8004/health
curl http://localhost:8005/health
```

### Logs

```bash
# View logs
docker-compose logs -f [service-name]

# View specific service
docker-compose logs -f cataract
```

---

## 🔗 Training Data

All training data is stored separately:

```
C:\Netra Ai Training Data\AI-Models\
├── 1-Anemia-Detection/
├── 2-Cataract-Detection/
├── 3-Diabetic-Retinopathy/
└── 4-Parkinsons-Voice-Detection/
```

See `TRAINING_DATA_LOCATION.txt` in project root.

---

## 📞 Service Communication

Services communicate via:
- **HTTP REST APIs** - For synchronous requests
- **Message Queue** (future) - For async processing
- **Shared Database** - For data persistence

---

## 🚢 Deployment Checklist

- [ ] All services have Dockerfiles
- [ ] Environment variables configured
- [ ] Models added to models/ folders
- [ ] Tests passing
- [ ] API documentation updated
- [ ] Health checks working
- [ ] Monitoring configured
- [ ] Logs configured

---

## 📝 Notes

- Model files are NOT in git (too large)
- Training data is separate from project
- Each service is independent
- Services can be deployed individually
- Use Docker for consistent environments

---

**Last Updated:** April 4, 2026  
**Services:** 6 (5 AI models + 1 core)  
**Status:** 4 deployed, 1 training, 1 running
