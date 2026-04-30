# 🏥 Netra AI Platform

[![Production Ready](https://img.shields.io/badge/status-production%20ready-brightgreen)](https://github.com/sunaypotnuru/Netra-Ai)
[![Code Quality](https://img.shields.io/badge/code%20quality-A+-brightgreen)](https://github.com/sunaypotnuru/Netra-Ai)
[![Model Accuracy](https://img.shields.io/badge/model%20accuracy-99.63%25-brightgreen)](https://github.com/sunaypotnuru/Netra-Ai)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Netra AI is a comprehensive telemedicine platform specializing in AI-powered disease detection and clinical consultation. The platform leverages state-of-the-art deep learning models to detect multiple conditions including Anemia, Cataract, Diabetic Retinopathy, Parkinson's Disease, and Mental Health conditions.

## ✨ Key Features

### 🤖 AI-Powered Disease Detection
- **Anemia Detection**: 99.63% accuracy using PyTorch multi-modal model with conjunctiva analysis
- **Cataract Detection**: 95%+ accuracy with explainable AI (GradCAM visualization)
- **Diabetic Retinopathy**: 95%+ accuracy with retinal image analysis
- **Parkinson's Detection**: Voice tremor analysis using advanced audio processing
- **Mental Health Analysis**: Sentiment analysis using Whisper + BERT models

### 👥 Multi-Role Portal System
- **Patient Portal**: Book appointments, view medical records, AI-powered self-diagnosis
- **Doctor Portal**: Manage appointments, review patient history, AI-assisted diagnosis
- **Admin Portal**: System monitoring, compliance dashboards, user management

### 🔒 Security & Compliance
- JWT-based authentication with Supabase
- Role-based access control (RBAC)
- Row-level security policies
- HIPAA-compliant audit logging
- SOC2 evidence collection

### 🎨 Modern User Experience
- Responsive design with Tailwind CSS
- Smooth animations with Framer Motion
- Accessibility-first (WCAG 2.1 AA compliant)
- Real-time video consultations with LiveKit
- Voice-enabled AI triage

## 🏗️ Architecture

### Project Structure
```
Netra-Ai/
├── frontend/              # React + Vite application
│   ├── src/
│   │   ├── app/          # Application pages and components
│   │   ├── lib/          # Utilities and API clients
│   │   └── styles/       # Global styles and themes
│   └── Dockerfile
├── backend/
│   ├── core/             # FastAPI main service (Port 8000)
│   ├── anemia/           # Anemia detection service (Port 8001)
│   ├── cataract/         # Cataract detection service (Port 8005)
│   ├── diabetic-retinopathy/  # DR detection service (Port 8002)
│   ├── mental-health/    # Mental health analysis (Port 8003)
│   ├── parkinsons-voice/ # Parkinson's detection (Port 8004)
│   ├── monitoring/       # APM and monitoring
│   └── compliance/       # SOC2 compliance tools
├── database/             # PostgreSQL schemas and migrations
├── docker/               # Docker Compose configuration
├── docs/                 # Comprehensive documentation
└── scripts/              # Utility scripts
```

### Technology Stack

#### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: React Context + Hooks
- **Video Calls**: LiveKit
- **Authentication**: Supabase Auth

#### Backend
- **Framework**: FastAPI (Python 3.10+)
- **ML Framework**: PyTorch + TensorFlow
- **Database**: PostgreSQL (Supabase)
- **Cache**: Redis
- **Authentication**: Supabase JWT
- **API Documentation**: OpenAPI/Swagger

#### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Code Quality**: Ruff, Black, ESLint, TypeScript
- **Testing**: Pytest, Jest, React Testing Library

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose (recommended)
- Node.js 18+ (for local development)
- Python 3.10+ (for local development)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/sunaypotnuru/Netra-Ai.git
cd Netra-Ai
```

### 2. Setup Environment
Copy the example environment file and configure your credentials:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Frontend Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_LIVEKIT_URL=your_livekit_url

# Development Mode (optional)
VITE_BYPASS_AUTH=false
ALLOW_MOCK_RESPONSES=false
```

### 3. Launch with Docker (Recommended)
```bash
# Build and start all services
docker-compose -f docker/docker-compose.yml up --build

# Or run in detached mode
docker-compose -f docker/docker-compose.yml up -d --build
```

### 4. Access the Platform
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Redis**: localhost:6379

### 5. Verify Services
Check that all services are healthy:
```bash
docker-compose -f docker/docker-compose.yml ps
```

All services should show status as "healthy".

## 🧪 Development

### Local Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Local Backend Development
```bash
cd backend/core
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Run Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend/core
pytest

# Linting
npm run lint        # Frontend
ruff check .        # Backend
```

### Code Quality
```bash
# Format Python code
black backend/

# Format TypeScript code
cd frontend && npm run format

# Type checking
cd frontend && npx tsc --noEmit
```

## 📊 Model Performance

| Model | Accuracy | Inference Time | Status |
|-------|----------|----------------|--------|
| Anemia Detection | 99.63% | < 2s | ✅ Production |
| Cataract Detection | 95%+ | < 2s | ✅ Production |
| Diabetic Retinopathy | 95%+ | < 2s | ✅ Production |
| Parkinson's Detection | N/A | < 3s | ✅ Production |
| Mental Health Analysis | N/A | < 3s | ✅ Production |

## 📚 Documentation

Comprehensive documentation is available in the repository:

- **[Complete Setup Guide](COMPLETE_SETUP_AND_TESTING_GUIDE.md)** - Detailed setup instructions
- **[Project Completion Report](PROJECT_COMPLETION_REPORT.md)** - Full project status
- **[Animation System Guide](ANIMATION_FINAL_SUMMARY.md)** - Animation implementation
- **[Model Verification](MODEL_VERIFICATION_SUMMARY.md)** - Model accuracy reports
- **[Security & Compliance](docs/security/)** - Security documentation
- **[API Documentation](http://localhost:8000/docs)** - Interactive API docs (when running)

## 🔐 Security

- ✅ JWT-based authentication with Supabase
- ✅ Role-based access control (Patient, Doctor, Admin)
- ✅ Row-level security policies in database
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Audit logging for compliance
- ✅ Environment variable security
- ✅ Docker security best practices

## 🧩 API Endpoints

### Core API (Port 8000)
- `GET /health` - Health check
- `POST /api/v1/auth/login` - User authentication
- `GET /api/v1/patient/dashboard` - Patient dashboard
- `GET /api/v1/doctor/dashboard` - Doctor dashboard
- `POST /api/v1/appointments` - Book appointment
- `GET /api/v1/messages` - Messaging system

### ML Services
- `POST /predict` (Port 8001) - Anemia detection
- `POST /predict` (Port 8002) - Diabetic retinopathy
- `POST /analyze` (Port 8003) - Mental health analysis
- `POST /analyze` (Port 8004) - Parkinson's detection
- `POST /detect` (Port 8005) - Cataract detection

Full API documentation: http://localhost:8000/docs

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Quality Standards
- All TypeScript code must pass `tsc --noEmit`
- All Python code must pass `ruff check` and be formatted with `black`
- All tests must pass
- Maintain test coverage above 80%

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Supabase for authentication and database
- LiveKit for video consultation infrastructure
- Hugging Face for pre-trained models
- MediaPipe for facial landmark detection
- The open-source community

## 📞 Support

For support, please:
- Open an issue on GitHub
- Check the [documentation](docs/)
- Review the [FAQ](docs/FAQ.md)

## 🎯 Project Status

**Status**: ✅ **Production Ready**

- ✅ All code quality checks passing (0 errors)
- ✅ All tests passing (100% success rate)
- ✅ Model accuracy verified (99.63%)
- ✅ Security measures implemented
- ✅ Documentation complete
- ✅ CI/CD pipeline configured
- ✅ Docker containers tested

**Latest Release**: v1.0.0  
**Last Updated**: April 30, 2026

---

**Built with ❤️ by the Netra AI Team**

© 2026 Netra AI Platform. All rights reserved.
