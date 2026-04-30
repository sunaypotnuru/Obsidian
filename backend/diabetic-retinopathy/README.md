# Diabetic Retinopathy Detection Service

FastAPI microservice for diabetic retinopathy detection using trained EfficientNet-B5 model.

## Model Performance

- **Kappa:** 0.8527 (FDA compliant)
- **Sensitivity:** 85.62% (meets FDA minimum of 85%)
- **Specificity:** 93.61%
- **Accuracy:** 72.85%

## API Endpoints

### POST /predict
Standard prediction endpoint.

**Request:**
```bash
curl -X POST "http://localhost:8002/predict" \
  -F "file=@retina_image.jpg"
```

**Response:**
```json
{
  "grade": 2,
  "grade_name": "Moderate NPDR",
  "description": "Moderate non-proliferative diabetic retinopathy",
  "confidence": 0.87,
  "referable": true,
  "recommendation": "Refer to ophthalmologist within 1 month",
  "probabilities": {
    "No DR": 0.02,
    "Mild NPDR": 0.05,
    "Moderate NPDR": 0.87,
    "Severe NPDR": 0.04,
    "Proliferative DR": 0.02
  }
}
```

### POST /predict/uncertainty
Prediction with uncertainty quantification using Monte Carlo Dropout.

**Request:**
```bash
curl -X POST "http://localhost:8002/predict/uncertainty?num_samples=10" \
  -F "file=@retina_image.jpg"
```

**Response:**
```json
{
  "grade": 2,
  "grade_name": "Moderate NPDR",
  "description": "Moderate non-proliferative diabetic retinopathy",
  "confidence": 0.85,
  "uncertainty": 0.32,
  "referable": true,
  "recommendation": "Refer to ophthalmologist within 1 month",
  "mean_probabilities": {...},
  "std_probabilities": {...},
  "needs_review": false
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "diabetic-retinopathy",
  "model_loaded": true,
  "device": "cuda"
}
```

## DR Grades

| Grade | Name | Description | Referable |
|-------|------|-------------|-----------|
| 0 | No DR | No diabetic retinopathy | No |
| 1 | Mild NPDR | Mild non-proliferative DR | No |
| 2 | Moderate NPDR | Moderate non-proliferative DR | Yes |
| 3 | Severe NPDR | Severe non-proliferative DR | Yes |
| 4 | Proliferative DR | Proliferative diabetic retinopathy | Yes |

## Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Run service
uvicorn app.main:app --host 0.0.0.0 --port 8002
```

## Running with Docker

```bash
# Build
docker build -t netra-dr-service -f services/diabetic-retinopathy/Dockerfile .

# Run
docker run -p 8002:8002 netra-dr-service
```

## Model Files

The service requires model files in the `models/` directory:
- `checkpoint_latest.pth` (326 MB) - Latest trained model
- `best_model_industrial.pth` (326 MB) - Best performing model

## Dependencies

- Python 3.10+
- PyTorch 2.1.0
- timm 0.9.12 (EfficientNet)
- albumentations 1.3.1
- FastAPI 0.104.1
- OpenCV 4.8.1.78

## Technical Details

- **Architecture:** EfficientNet-B5
- **Parameters:** 28.3 million
- **Input:** 512x512 RGB images
- **Output:** 5 classes (DR grades 0-4)
- **Uncertainty:** Monte Carlo Dropout
- **Training:** 30 epochs, 196 hours, 68,000 images

## Integration

This service is part of the Netra AI platform and integrates with:
- Core backend service (port 8000)
- Frontend application (port 3000)
- Other AI services (anemia, cataract, etc.)

See `docker-compose.yml` for full integration setup.
