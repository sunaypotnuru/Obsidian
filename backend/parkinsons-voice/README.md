# Parkinson's Voice Detection Service

**Status:** ⏳ Model Training on RTX 4060  
**Expected Accuracy:** 85-92%  
**Port:** 8004  
**Type:** FastAPI microservice

## Overview

AI-powered Parkinson's disease detection service using voice analysis. Analyzes sustained phonation ("ahhh" sound) to detect vocal biomarkers of Parkinson's disease.

## Model Details

- **Architecture:** CNN + LSTM hybrid
- **Expected Accuracy:** 85-92%
- **Features:** MFCC (40 coefficients), spectral features
- **Input:** Voice audio (16kHz mono WAV)
- **Output:** Binary classification (PD vs healthy)

## Dataset

- **Source:** ParkCeleb dataset
- **Total Samples:** 84,210 audio files
- **PD Samples:** 40,635 (48.3%)
- **CN Samples:** 43,504 (51.7%)
- **Speakers:** 100 (40 PD + 60 CN)
- **Size:** 24.46 GB

## Folder Structure

```
parkinsons-voice/
├── app/
│   └── main.py          # FastAPI application
├── models/              # Trained model weights (pending)
├── tests/               # Unit tests
├── Dockerfile           # Docker configuration
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Setup

### Local Development

```bash
cd services/parkinsons-voice

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run service
python -m uvicorn app.main:app --reload --port 8004
```

### Docker

```bash
# Build image
docker build -t netra-parkinsons .

# Run container
docker run -p 8004:8004 netra-parkinsons
```

## API Endpoints

### Health Check
```
GET /health
```

### Predict
```
POST /predict
Content-Type: multipart/form-data

Body:
- file: Audio file (WAV, MP3) - sustained "ahhh" sound

Response:
{
  "prediction": "healthy" | "parkinsons",
  "confidence": 0.92,
  "risk_level": "low" | "medium" | "high",
  "voice_features": {
    "spectral_centroid": 1234.5,
    "spectral_rolloff": 2345.6,
    "zero_crossing_rate": 0.123
  },
  "recommendations": ["..."]
}
```

## Training Status

- **Platform:** RTX 4060 laptop
- **Expected Time:** 6-8 hours
- **Status:** In progress
- **Monitoring:** TensorBoard logs

## Voice Recording Guidelines

For best results, users should:
1. Record in a quiet environment
2. Sustain "ahhh" sound for 3-5 seconds
3. Use consistent volume
4. Avoid background noise
5. Use good quality microphone

## Model Integration

1. Wait for training completion on RTX 4060
2. Copy trained model to `models/` folder
3. Update `app/main.py` to load actual model
4. Test with sample audio files
5. Deploy to production

## Testing

```bash
# Run tests
pytest tests/

# Test API
curl -X POST http://localhost:8004/predict \
  -F "file=@voice_sample.wav"
```

## Deployment

Service will be deployed as part of the Netra-AI platform:
- Production: https://api.netra-ai.com/parkinsons
- Staging: https://staging-api.netra-ai.com/parkinsons

## Training Data Location

Training data and scripts are in:
```
C:\Netra Ai Training Data\AI-Models\4-Parkinsons-Voice-Detection\
```

## Next Steps

- [ ] Wait for training completion
- [ ] Copy trained model from RTX 4060
- [ ] Implement actual prediction logic
- [ ] Add voice quality validation
- [ ] Add batch prediction endpoint
- [ ] Add model versioning
- [ ] Deploy to production

## Contact

For model updates or issues, see main project documentation.
