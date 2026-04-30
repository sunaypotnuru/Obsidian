# 🚀 Technical Stack

Complete technology stack documentation for Netra AI platform.

## 📋 Table of Contents

- [Overview](#-overview)
- [Frontend Stack](#-frontend-stack)
- [Backend Stack](#-backend-stack)
- [AI/ML Stack](#-aiml-stack)
- [Database & Storage](#-database--storage)
- [DevOps & Infrastructure](#-devops--infrastructure)
- [Third-Party Services](#-third-party-services)

---

## 🎯 Overview

Netra AI is built with modern, production-ready technologies optimized for healthcare applications.

### Architecture Pattern
- **Frontend**: Single Page Application (SPA)
- **Backend**: Microservices Architecture
- **AI Services**: Independent containerized services
- **Database**: PostgreSQL with Row Level Security
- **Deployment**: Docker containers with orchestration

---

## 🎨 Frontend Stack

### Core Framework
- **React 18.3.1**: UI library with concurrent features
- **TypeScript 5.3**: Type-safe JavaScript
- **Vite 5.0**: Fast build tool and dev server

### UI Components
- **shadcn/ui**: Accessible component library
- **Radix UI**: Headless UI primitives
- **Tailwind CSS 3.4**: Utility-first CSS framework
- **Lucide React**: Icon library

### State Management
- **Zustand**: Lightweight state management
- **React Query**: Server state management
- **React Context**: Global state for auth

### Routing & Navigation
- **React Router 6**: Client-side routing
- **React Router DOM**: DOM bindings

### Forms & Validation
- **React Hook Form**: Performant forms
- **Zod**: TypeScript-first schema validation

### Data Visualization
- **Recharts**: Composable charting library
- **D3.js**: Advanced visualizations

### Utilities
- **date-fns**: Date manipulation
- **clsx**: Conditional classNames
- **tailwind-merge**: Merge Tailwind classes

### PWA Features
- **Workbox**: Service worker library
- **Web Workers**: Background processing
- **IndexedDB**: Client-side storage

---

## 🔙 Backend Stack

### Core Framework
- **FastAPI 0.104.1**: Modern Python web framework
- **Python 3.11**: Programming language
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation

### Authentication & Security
- **JWT**: JSON Web Tokens
- **bcrypt**: Password hashing
- **python-jose**: JWT implementation
- **passlib**: Password hashing utilities

### Database ORM
- **Supabase Python Client**: Database client
- **PostgreSQL**: Relational database
- **asyncpg**: Async PostgreSQL driver

### API Documentation
- **OpenAPI 3.0**: API specification
- **Swagger UI**: Interactive API docs
- **ReDoc**: Alternative API docs

### Middleware
- **CORS Middleware**: Cross-origin requests
- **Rate Limiting**: Request throttling
- **Compression**: Response compression
- **Security Headers**: HTTP security

### Background Tasks
- **Celery**: Distributed task queue
- **Redis**: Message broker
- **APScheduler**: Job scheduling

### File Handling
- **Pillow**: Image processing
- **python-multipart**: File uploads
- **aiofiles**: Async file operations

---

## 🤖 AI/ML Stack

### Deep Learning Frameworks
- **PyTorch 2.1**: Primary ML framework
- **TorchVision**: Computer vision models
- **ONNX Runtime**: Model inference optimization

### Computer Vision
- **OpenCV**: Image processing
- **Albumentations**: Image augmentation
- **scikit-image**: Image algorithms

### NLP & Audio
- **Whisper**: Speech-to-text (OpenAI)
- **Transformers**: Hugging Face models
- **MentalBERT**: Mental health NLP
- **librosa**: Audio analysis

### Model Architectures

**Cataract Detection:**
- **Swin Transformer**: Vision transformer
- **Grad-CAM**: Explainable AI
- **Accuracy**: 96%

**DR Detection:**
- **EfficientNet-B5**: CNN architecture
- **5-grade classification**: WHO-aligned
- **Accuracy**: 95%

**Anemia Detection:**
- **Custom CNN**: Conjunctiva analysis
- **Hemoglobin estimation**: Non-invasive
- **Accuracy**: 92%

**Mental Health:**
- **Whisper Large**: Speech-to-text
- **MentalBERT**: Sentiment analysis
- **DeepFace**: Emotion recognition
- **Accuracy**: 85-89%

**Parkinson's Detection:**
- **LightGBM**: Gradient boosting
- **33 acoustic features**: Voice analysis
- **Accuracy**: 70.9%

### ML Utilities
- **NumPy**: Numerical computing
- **Pandas**: Data manipulation
- **scikit-learn**: ML algorithms
- **matplotlib**: Visualization

---

## 🗄️ Database & Storage

### Primary Database
- **PostgreSQL 14**: Relational database
- **Supabase**: Managed PostgreSQL
- **Row Level Security**: Data isolation
- **Real-time subscriptions**: Live updates

### Caching
- **Redis 7**: In-memory cache
- **Cache strategies**: LRU, TTL
- **Session storage**: User sessions

### File Storage
- **Supabase Storage**: Object storage
- **AWS S3**: Alternative storage
- **Local storage**: Development

### Database Features
- **JSONB**: Flexible data storage
- **Full-text search**: PostgreSQL FTS
- **PostGIS**: Geospatial data
- **pg_trgm**: Fuzzy search

---

## 🚀 DevOps & Infrastructure

### Containerization
- **Docker 24**: Container platform
- **Docker Compose**: Multi-container apps
- **Multi-stage builds**: Optimized images

### Orchestration
- **Kubernetes**: Container orchestration
- **Helm**: Package manager
- **kubectl**: CLI tool

### CI/CD
- **GitHub Actions**: Automation
- **Docker Hub**: Container registry
- **Automated testing**: CI pipeline

### Monitoring & Logging
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Alertmanager**: Alert routing
- **Loki**: Log aggregation

### Web Server
- **Nginx**: Reverse proxy
- **Load balancing**: Traffic distribution
- **SSL/TLS**: HTTPS encryption
- **Rate limiting**: DDoS protection

### Cloud Platforms
- **Vercel**: Frontend hosting
- **Railway**: Backend hosting
- **Render**: Alternative hosting
- **AWS**: Enterprise deployment

---

## 🔌 Third-Party Services

### Authentication
- **Supabase Auth**: User management
- **OAuth 2.0**: Social login
- **JWT**: Token-based auth

### Email
- **SendGrid**: Transactional email
- **Mailgun**: Alternative email
- **SMTP**: Email protocol

### Payment (Optional)
- **Stripe**: Payment processing
- **Razorpay**: India payments
- **PayPal**: Alternative payment

### Video Calls
- **LiveKit**: WebRTC infrastructure
- **Twilio**: Alternative video
- **Agora**: Video SDK

### Analytics
- **Google Analytics**: Web analytics
- **Mixpanel**: Product analytics
- **Sentry**: Error tracking

### Maps & Location
- **Google Maps**: Mapping service
- **Mapbox**: Alternative maps
- **Geolocation API**: Browser location

---

## 📊 Technology Comparison

### Why React over Vue/Angular?
- ✅ Largest ecosystem
- ✅ Best TypeScript support
- ✅ Concurrent features
- ✅ Strong community

### Why FastAPI over Django/Flask?
- ✅ Async support
- ✅ Automatic API docs
- ✅ Type hints
- ✅ High performance

### Why PostgreSQL over MongoDB?
- ✅ ACID compliance
- ✅ Complex queries
- ✅ Data integrity
- ✅ Healthcare compliance

### Why PyTorch over TensorFlow?
- ✅ Pythonic API
- ✅ Dynamic graphs
- ✅ Research-friendly
- ✅ Better debugging

---

## 🔧 Development Tools

### Code Quality
- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **Black**: Python formatting
- **mypy**: Python type checking

### Testing
- **Vitest**: Unit testing (frontend)
- **Playwright**: E2E testing
- **pytest**: Unit testing (backend)
- **pytest-cov**: Coverage reporting

### Version Control
- **Git**: Source control
- **GitHub**: Repository hosting
- **Git LFS**: Large file storage

### IDE & Extensions
- **VS Code**: Primary IDE
- **PyCharm**: Python IDE
- **Cursor**: AI-powered IDE

---

## 📦 Package Management

### Frontend
- **npm**: Package manager
- **pnpm**: Alternative (faster)
- **package.json**: Dependencies

### Backend
- **pip**: Package installer
- **poetry**: Dependency management
- **requirements.txt**: Dependencies

### Docker
- **Docker Hub**: Image registry
- **GitHub Container Registry**: Alternative

---

## 🔒 Security Stack

### Authentication
- JWT with RS256 algorithm
- Refresh token rotation
- Session management
- Password hashing (bcrypt)

### Authorization
- Role-based access control (RBAC)
- Row Level Security (RLS)
- API key authentication
- OAuth 2.0

### Data Protection
- HTTPS/TLS encryption
- Database encryption at rest
- Encrypted backups
- PII anonymization

### Compliance
- HIPAA compliance ready
- GDPR compliant
- SOC 2 Type II ready
- FDA 21 CFR Part 11

---

## 📈 Performance Optimization

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Service worker caching
- CDN delivery

### Backend
- Database indexing
- Query optimization
- Connection pooling
- Response caching
- Async operations

### AI Models
- Model quantization
- ONNX optimization
- Batch processing
- GPU acceleration
- Model caching

---

## 🌐 Internationalization

### Frontend
- **i18next**: Translation framework
- **react-i18next**: React integration
- **6 languages**: EN, ES, FR, HI, ZH, AR

### Backend
- **gettext**: Translation system
- **Babel**: Internationalization
- **Language detection**: Auto-detect

---

## 📱 Mobile Support

### Progressive Web App
- Service worker
- Offline support
- Push notifications
- Install prompt
- App-like experience

### Responsive Design
- Mobile-first approach
- Tailwind breakpoints
- Touch-friendly UI
- Adaptive layouts

---

## 🎯 Technology Versions

### Frontend
```json
{
  "react": "18.3.1",
  "typescript": "5.3.3",
  "vite": "5.0.8",
  "tailwindcss": "3.4.1"
}
```

### Backend
```txt
fastapi==0.104.1
python==3.11
uvicorn==0.24.0
supabase==2.3.0
```

### AI/ML
```txt
torch==2.1.0
transformers==4.35.0
opencv-python==4.8.1
whisper==1.1.10
```

---

## 🚀 Future Technology Additions

### Planned
- **GraphQL**: Alternative API
- **WebSockets**: Real-time features
- **Blockchain**: Health records
- **Edge Computing**: Faster inference
- **Federated Learning**: Privacy-preserving ML

---

**Last Updated**: April 23, 2026  
**Version**: 4.0.0  
**Status**: ✅ Production Stack
