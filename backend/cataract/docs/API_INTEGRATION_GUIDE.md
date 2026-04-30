# 🔌 API Integration Guide - Cataract Detection

**Model**: Swin-Base Transformer  
**Performance**: 96% Sensitivity, 90.2% Specificity  
**Status**: Production Ready

---

## 📋 Overview

This guide shows how to integrate the cataract detection API into your main project. We provide examples for both Flask and FastAPI implementations.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the API Server

**Option A: Flask (Simple)**
```bash
python flask_api.py
```
Server runs on: `http://localhost:5000`

**Option B: FastAPI (Recommended)**
```bash
python fastapi_server.py
```
Server runs on: `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs`

---

## 📡 API Endpoints

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/health` | GET | Health check |
| `/model_info` | GET | Model specifications |
| `/predict` | POST | Predict from uploaded file |
| `/predict_base64` | POST | Predict from base64 image |

---

## 💻 Integration Examples

### Python Client

```python
import requests
from PIL import Image
import io

# API endpoint
API_URL = "http://localhost:8000"  # or 5000 for Flask

def predict_cataract(image_path):
    """
    Send image to API and get prediction
    """
    # Open image file
    with open(image_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{API_URL}/predict", files=files)
    
    if response.status_code == 200:
        result = response.json()
        return result
    else:
        raise Exception(f"API error: {response.text}")

# Example usage
result = predict_cataract('patient_eye.jpg')
print(f"Prediction: {result['prediction']}")
print(f"Confidence: {result['confidence']:.1%}")
print(f"Cataract Probability: {result['cataract_probability']:.3f}")
```

### Python with Base64

```python
import requests
import base64
from PIL import Image
import io

API_URL = "http://localhost:8000"

def predict_cataract_base64(image_path):
    """
    Send base64 encoded image to API
    """
    # Read and encode image
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
    
    # Send request
    response = requests.post(
        f"{API_URL}/predict_base64",
        json={'image': image_base64}
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"API error: {response.text}")

# Example usage
result = predict_cataract_base64('patient_eye.jpg')
print(f"Result: {result['prediction']}")
```

### JavaScript/Node.js

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = 'http://localhost:8000';

async function predictCataract(imagePath) {
    try {
        // Create form data
        const formData = new FormData();
        formData.append('file', fs.createReadStream(imagePath));
        
        // Send request
        const response = await axios.post(
            `${API_URL}/predict`,
            formData,
            {
                headers: formData.getHeaders()
            }
        );
        
        return response.data;
    } catch (error) {
        console.error('API error:', error.message);
        throw error;
    }
}

// Example usage
predictCataract('patient_eye.jpg')
    .then(result => {
        console.log('Prediction:', result.prediction);
        console.log('Confidence:', result.confidence);
    })
    .catch(error => {
        console.error('Error:', error);
    });
```

### JavaScript with Base64

```javascript
const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:8000';

async function predictCataractBase64(imagePath) {
    try {
        // Read and encode image
        const imageBuffer = fs.readFileSync(imagePath);
        const imageBase64 = imageBuffer.toString('base64');
        
        // Send request
        const response = await axios.post(
            `${API_URL}/predict_base64`,
            { image: imageBase64 }
        );
        
        return response.data;
    } catch (error) {
        console.error('API error:', error.message);
        throw error;
    }
}

// Example usage
predictCataractBase64('patient_eye.jpg')
    .then(result => {
        console.log('Result:', result.prediction);
        console.log('Probability:', result.cataract_probability);
    });
```

### React Frontend

```javascript
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function CataractDetector() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileSelect = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handlePredict = async () => {
        if (!selectedFile) {
            alert('Please select an image first');
            return;
        }

        setLoading(true);
        
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await axios.post(
                `${API_URL}/predict`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setResult(response.data);
        } catch (error) {
            console.error('Error:', error);
            alert('Prediction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Cataract Detection</h2>
            
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileSelect}
            />
            
            <button 
                onClick={handlePredict}
                disabled={loading || !selectedFile}
            >
                {loading ? 'Analyzing...' : 'Detect Cataract'}
            </button>

            {result && (
                <div>
                    <h3>Result: {result.prediction}</h3>
                    <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                    <p>Cataract Probability: {(result.cataract_probability * 100).toFixed(1)}%</p>
                </div>
            )}
        </div>
    );
}

export default CataractDetector;
```

### cURL Examples

**Upload File**:
```bash
curl -X POST \
  http://localhost:8000/predict \
  -F "file=@patient_eye.jpg"
```

**Base64 Image**:
```bash
# Encode image to base64
IMAGE_BASE64=$(base64 -w 0 patient_eye.jpg)

# Send request
curl -X POST \
  http://localhost:8000/predict_base64 \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE_BASE64\"}"
```

**Health Check**:
```bash
curl http://localhost:8000/health
```

**Model Info**:
```bash
curl http://localhost:8000/model_info
```

---

## 🔧 Advanced Integration

### Batch Processing

```python
import requests
from concurrent.futures import ThreadPoolExecutor
import os

API_URL = "http://localhost:8000"

def predict_single(image_path):
    """Predict single image"""
    with open(image_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{API_URL}/predict", files=files)
    return response.json()

def predict_batch(image_paths, max_workers=5):
    """
    Predict multiple images in parallel
    
    Args:
        image_paths: List of image file paths
        max_workers: Number of parallel requests
        
    Returns:
        List of prediction results
    """
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        results = list(executor.map(predict_single, image_paths))
    
    return results

# Example usage
image_folder = 'patient_images/'
image_paths = [
    os.path.join(image_folder, f) 
    for f in os.listdir(image_folder) 
    if f.endswith(('.jpg', '.png'))
]

results = predict_batch(image_paths)

# Process results
for path, result in zip(image_paths, results):
    print(f"{path}: {result['prediction']} ({result['confidence']:.1%})")
```

### Error Handling

```python
import requests
from requests.exceptions import RequestException
import time

API_URL = "http://localhost:8000"

def predict_with_retry(image_path, max_retries=3):
    """
    Predict with automatic retry on failure
    """
    for attempt in range(max_retries):
        try:
            with open(image_path, 'rb') as f:
                files = {'file': f}
                response = requests.post(
                    f"{API_URL}/predict",
                    files=files,
                    timeout=30
                )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Attempt {attempt + 1} failed: {response.status_code}")
                
        except RequestException as e:
            print(f"Attempt {attempt + 1} error: {e}")
        
        if attempt < max_retries - 1:
            time.sleep(2 ** attempt)  # Exponential backoff
    
    raise Exception(f"Failed after {max_retries} attempts")

# Example usage
try:
    result = predict_with_retry('patient_eye.jpg')
    print(f"Success: {result['prediction']}")
except Exception as e:
    print(f"Failed: {e}")
```

### Performance Monitoring

```python
import requests
import time
from datetime import datetime

API_URL = "http://localhost:8000"

class APIMonitor:
    def __init__(self):
        self.predictions = []
        self.errors = []
    
    def predict(self, image_path):
        """Predict with monitoring"""
        start_time = time.time()
        
        try:
            with open(image_path, 'rb') as f:
                files = {'file': f}
                response = requests.post(f"{API_URL}/predict", files=files)
            
            processing_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                self.predictions.append({
                    'timestamp': datetime.now(),
                    'image': image_path,
                    'prediction': result['prediction'],
                    'confidence': result['confidence'],
                    'processing_time': processing_time
                })
                return result
            else:
                self.errors.append({
                    'timestamp': datetime.now(),
                    'image': image_path,
                    'error': response.text
                })
                raise Exception(f"API error: {response.text}")
                
        except Exception as e:
            self.errors.append({
                'timestamp': datetime.now(),
                'image': image_path,
                'error': str(e)
            })
            raise
    
    def get_stats(self):
        """Get performance statistics"""
        if not self.predictions:
            return {'message': 'No predictions yet'}
        
        processing_times = [p['processing_time'] for p in self.predictions]
        cataract_count = sum(1 for p in self.predictions if 'CATARACT' in p['prediction'])
        
        return {
            'total_predictions': len(self.predictions),
            'cataract_detected': cataract_count,
            'normal_detected': len(self.predictions) - cataract_count,
            'avg_processing_time': sum(processing_times) / len(processing_times),
            'min_processing_time': min(processing_times),
            'max_processing_time': max(processing_times),
            'total_errors': len(self.errors),
            'success_rate': len(self.predictions) / (len(self.predictions) + len(self.errors))
        }

# Example usage
monitor = APIMonitor()

for image_path in ['image1.jpg', 'image2.jpg', 'image3.jpg']:
    try:
        result = monitor.predict(image_path)
        print(f"{image_path}: {result['prediction']}")
    except Exception as e:
        print(f"{image_path}: Error - {e}")

# Get statistics
stats = monitor.get_stats()
print(f"\nStatistics:")
print(f"Total predictions: {stats['total_predictions']}")
print(f"Average time: {stats['avg_processing_time']:.3f}s")
print(f"Success rate: {stats['success_rate']:.1%}")
```

---

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run FastAPI server
CMD ["python", "fastapi_server.py"]
```

### Build and Run

```bash
# Build image
docker build -t cataract-detection-api .

# Run container
docker run -p 8000:8000 cataract-detection-api
```

---

## 📊 Response Format

### Successful Response

```json
{
    "success": true,
    "prediction": "CATARACT DETECTED",
    "cataract_probability": 0.856,
    "confidence": 0.856,
    "threshold": 0.20,
    "model_version": "1.0",
    "timestamp": "2026-04-14T10:30:45.123456"
}
```

### Error Response

```json
{
    "success": false,
    "error": "Error message description"
}
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# .env file
MODEL_PATH=models/swin_combined_best.pth
THRESHOLD=0.20
API_PORT=8000
LOG_LEVEL=INFO
```

### Load in Python

```python
from dotenv import load_dotenv
import os

load_dotenv()

MODEL_PATH = os.getenv('MODEL_PATH', 'models/swin_combined_best.pth')
THRESHOLD = float(os.getenv('THRESHOLD', '0.20'))
API_PORT = int(os.getenv('API_PORT', '8000'))
```

---

## 🔒 Security Considerations

### 1. Input Validation
- Validate file types (JPEG, PNG only)
- Limit file size (e.g., max 10MB)
- Sanitize filenames

### 2. Rate Limiting
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/predict")
@limiter.limit("10/minute")
async def predict(file: UploadFile = File(...)):
    # ... prediction code
```

### 3. Authentication
```python
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    # Verify token
    if credentials.credentials != "your-secret-token":
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # ... prediction code
```

---

## 📈 Performance Tips

1. **Use GPU**: Ensure CUDA is available for faster inference
2. **Batch Processing**: Process multiple images together
3. **Caching**: Cache model in memory (already done)
4. **Async Processing**: Use FastAPI for better concurrency
5. **Load Balancing**: Deploy multiple instances behind a load balancer

---

## ✅ Testing

### Test API Health

```python
import requests

response = requests.get('http://localhost:8000/health')
print(response.json())
```

### Test Prediction

```python
import requests

with open('test_image.jpg', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:8000/predict', files=files)
    
print(response.json())
```

---

## 📞 Support

### API Documentation
- FastAPI: Visit `http://localhost:8000/docs` for interactive docs
- Flask: Use this guide for endpoint reference

### Model Information
- Sensitivity: 96.0%
- Specificity: 90.2%
- Threshold: 0.20
- Version: 1.0

---

**Generated**: April 14, 2026  
**Status**: Production Ready  
**Version**: 1.0
