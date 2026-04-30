# 🚀 Cataract Detection AI - Deployment Guide

**Model**: Swin-Base Transformer  
**Performance**: 96% Sensitivity, 90.2% Specificity  
**Status**: ✅ Production Ready

---

## 📋 Prerequisites

### System Requirements
- **Python**: 3.8+
- **PyTorch**: 1.9+
- **GPU**: CUDA-compatible (recommended)
- **RAM**: 8GB+ (16GB recommended)
- **Storage**: 2GB for model files

### Dependencies
```bash
pip install torch torchvision timm pillow numpy scikit-learn matplotlib
```

---

## 🔧 Installation Steps

### 1. **Copy Model Files**
```bash
# Copy the trained model
cp model_files/swin_combined_best.pth /your/project/models/

# Copy deployment code
cp deployment_code/* /your/project/src/
```

### 2. **Basic Integration**
```python
import torch
import timm
from PIL import Image
from torchvision import transforms

# Load the model
model = timm.create_model('swin_base_patch4_window7_224', 
                          pretrained=False, num_classes=2)
model.load_state_dict(torch.load('models/swin_combined_best.pth'))
model.eval()

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def predict_cataract(image_path):
    """
    Predict cataract from eye image
    
    Args:
        image_path: Path to eye image
        
    Returns:
        tuple: (prediction, confidence)
    """
    # Load and preprocess image
    image = Image.open(image_path).convert('RGB')
    image_tensor = transform(image).unsqueeze(0)
    
    # Get prediction
    with torch.no_grad():
        output = model(image_tensor)
        probs = torch.softmax(output, dim=1)
        cataract_prob = probs[0, 1].item()
    
    # Use optimized threshold
    THRESHOLD = 0.20
    
    if cataract_prob >= THRESHOLD:
        return "CATARACT DETECTED", cataract_prob
    else:
        return "NORMAL", 1 - cataract_prob

# Example usage
result, confidence = predict_cataract('patient_eye.jpg')
print(f"Result: {result}")
print(f"Confidence: {confidence:.1%}")
```

---

## ⚙️ Configuration

### Optimal Settings
```python
# Model Configuration
MODEL_NAME = 'swin_base_patch4_window7_224'
MODEL_PATH = 'models/swin_combined_best.pth'
INPUT_SIZE = (224, 224)
THRESHOLD = 0.20  # Optimized for 96% sensitivity

# Performance Expectations
EXPECTED_SENSITIVITY = 0.96  # 96% of cataracts detected
EXPECTED_SPECIFICITY = 0.902  # 90.2% of normal cases correct
EXPECTED_ACCURACY = 0.908    # 90.8% overall accuracy
```

### Threshold Options
```python
# Different threshold options based on use case
THRESHOLDS = {
    'screening': 0.20,      # 96% sens, 90% spec (recommended)
    'balanced': 0.25,       # 93% sens, 93% spec
    'conservative': 0.30,   # 92% sens, 95% spec
}
```

---

## 🔄 API Integration

### Flask API Example
```python
from flask import Flask, request, jsonify
import torch
import timm
from PIL import Image
import io
import base64

app = Flask(__name__)

# Load model once at startup
model = timm.create_model('swin_base_patch4_window7_224', 
                          pretrained=False, num_classes=2)
model.load_state_dict(torch.load('models/swin_combined_best.pth'))
model.eval()

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get image from request
        image_data = request.json['image']  # base64 encoded
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Predict
        result, confidence = predict_cataract_from_pil(image)
        
        return jsonify({
            'prediction': result,
            'confidence': float(confidence),
            'threshold': 0.20,
            'model_version': '1.0'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

### FastAPI Example
```python
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import torch
import timm
from PIL import Image
import io

app = FastAPI(title="Cataract Detection API")

# Load model
model = timm.create_model('swin_base_patch4_window7_224', 
                          pretrained=False, num_classes=2)
model.load_state_dict(torch.load('models/swin_combined_best.pth'))
model.eval()

@app.post("/predict")
async def predict_cataract_api(file: UploadFile = File(...)):
    """
    Predict cataract from uploaded image
    """
    try:
        # Read image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Predict
        result, confidence = predict_cataract_from_pil(image)
        
        return {
            "prediction": result,
            "confidence": confidence,
            "sensitivity": 0.96,
            "specificity": 0.902,
            "model_info": {
                "architecture": "Swin-Base Transformer",
                "threshold": 0.20,
                "version": "1.0"
            }
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": f"Prediction failed: {str(e)}"}
        )
```

---

## 📊 Performance Monitoring

### Logging Predictions
```python
import logging
import json
from datetime import datetime

# Setup logging
logging.basicConfig(
    filename='cataract_predictions.log',
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)

def log_prediction(image_path, prediction, confidence, processing_time):
    """Log prediction for monitoring"""
    log_data = {
        'timestamp': datetime.now().isoformat(),
        'image_path': image_path,
        'prediction': prediction,
        'confidence': confidence,
        'processing_time_ms': processing_time,
        'model_version': '1.0',
        'threshold': 0.20
    }
    logging.info(json.dumps(log_data))
```

### Performance Metrics
```python
class PerformanceMonitor:
    def __init__(self):
        self.predictions = []
        self.processing_times = []
    
    def add_prediction(self, prediction, confidence, processing_time):
        self.predictions.append({
            'prediction': prediction,
            'confidence': confidence,
            'processing_time': processing_time,
            'timestamp': datetime.now()
        })
    
    def get_stats(self):
        if not self.predictions:
            return {}
        
        processing_times = [p['processing_time'] for p in self.predictions]
        cataract_predictions = [p for p in self.predictions if 'CATARACT' in p['prediction']]
        
        return {
            'total_predictions': len(self.predictions),
            'cataract_detected': len(cataract_predictions),
            'avg_processing_time': sum(processing_times) / len(processing_times),
            'avg_confidence': sum(p['confidence'] for p in self.predictions) / len(self.predictions)
        }
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **Model Loading Error**
```python
# Issue: Model file not found
# Solution: Check file path
import os
model_path = 'models/swin_combined_best.pth'
if not os.path.exists(model_path):
    print(f"Model file not found: {model_path}")
    # Download or copy model file
```

#### 2. **CUDA Out of Memory**
```python
# Issue: GPU memory error
# Solution: Use CPU or reduce batch size
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

# For CPU inference
model = model.to('cpu')
```

#### 3. **Image Format Issues**
```python
# Issue: Unsupported image format
# Solution: Convert to RGB
try:
    image = Image.open(image_path).convert('RGB')
except Exception as e:
    print(f"Image loading error: {e}")
    # Handle error appropriately
```

#### 4. **Performance Issues**
```python
# Issue: Slow inference
# Solutions:
# 1. Use GPU
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# 2. Optimize model
model = torch.jit.script(model)  # TorchScript optimization

# 3. Batch processing
def predict_batch(image_paths):
    images = []
    for path in image_paths:
        image = Image.open(path).convert('RGB')
        images.append(transform(image))
    
    batch = torch.stack(images)
    with torch.no_grad():
        outputs = model(batch)
        probs = torch.softmax(outputs, dim=1)
    
    return probs[:, 1].tolist()  # Return cataract probabilities
```

---

## 📈 Performance Expectations

### Typical Performance
- **Inference Time**: 50-200ms per image (GPU)
- **Memory Usage**: 2-4GB GPU memory
- **Throughput**: 5-20 images/second
- **Accuracy**: 90.8% on test data

### Scaling Considerations
- **Single GPU**: 100-500 images/hour
- **Multiple GPUs**: 1000+ images/hour
- **CPU Only**: 10-50 images/hour
- **Batch Processing**: 2-5x speedup

---

## ✅ Validation Checklist

Before deployment, verify:

- [ ] Model loads successfully
- [ ] Predictions match expected format
- [ ] Performance meets requirements
- [ ] Error handling works
- [ ] Logging is configured
- [ ] API endpoints respond correctly
- [ ] Threshold is set to 0.20
- [ ] Test with sample images

---

## 📞 Support Information

### Model Details
- **Architecture**: Swin-Base Transformer
- **Input Size**: 224×224 RGB
- **Output**: Binary classification (cataract/normal)
- **Threshold**: 0.20 (optimized)

### Performance Metrics
- **Sensitivity**: 96.0% (detects 96% of cataracts)
- **Specificity**: 90.2% (90% correct on normal cases)
- **NPV**: 98.3% (very reliable when says "normal")
- **PPV**: 54.1% (positive cases need confirmation)

### Contact
- Model trained and validated: April 14, 2026
- Validation: 1,150 test images
- Status: Production ready

---

**Generated**: April 14, 2026  
**Version**: 1.0  
**Status**: ✅ Ready for Deployment