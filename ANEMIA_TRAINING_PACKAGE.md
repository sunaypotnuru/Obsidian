# 🎯 Anemia Detection Model Training Package

**For:** ML Training Team  
**Date:** April 29, 2026  
**Project:** Netra-Ai Anemia Detection Service  
**Framework:** PyTorch (migrated from TensorFlow)

---

## 📦 Complete Package Contents

### 1. **PyTorch Model Architecture** ✅
- **File:** `backend/anemia/src/model_pytorch.py`
- **Classes:** `EnhancedAnemiaNet`, `SimpleAnemiaNet`
- **Input:** (batch_size, 3, 64, 64) - RGB images
- **Output:** (batch_size, 1) - Sigmoid probability [0.0-1.0]

### 2. **Complete Pipeline** ✅
- **File:** `backend/anemia/src/pipeline.py`
- **Features:** Eye extraction, enhancement, preprocessing, inference
- **Integration:** Ready for production API

### 3. **Image Processing Components** ✅
- **Eye Extractor:** `src/eye_extractor.py` - Conjunctiva ROI detection
- **Image Enhancer:** `src/enhancer.py` - Medical image enhancement
- **GradCAM:** `src/gradcam.py` - Explainability heatmaps

### 4. **Production API** ✅
- **File:** `api.py`
- **Endpoints:** `/predict`, `/health`
- **Features:** File upload, URL processing, validation

### 5. **Configuration & Logging** ✅
- **Config:** `src/config.py` - Model parameters
- **Audit:** `src/audit_logger.py` - Compliance logging

---

## 🏗️ Model Architecture Details

### Enhanced CNN Architecture
```python
EnhancedAnemiaNet(
  # Block 1 - 32 filters
  (conv1_1): Conv2d(3, 32, kernel_size=3, padding=1)
  (bn1_1): BatchNorm2d(32)
  (conv1_2): Conv2d(32, 32, kernel_size=3, padding=1)
  (bn1_2): BatchNorm2d(32)
  (pool1): MaxPool2d(2, 2)
  (dropout1): Dropout2d(0.25)
  
  # Block 2 - 64 filters
  (conv2_1): Conv2d(32, 64, kernel_size=3, padding=1)
  (bn2_1): BatchNorm2d(64)
  (conv2_2): Conv2d(64, 64, kernel_size=3, padding=1)
  (bn2_2): BatchNorm2d(64)
  (pool2): MaxPool2d(2, 2)
  (dropout2): Dropout2d(0.25)
  
  # Block 3 - 128 filters
  (conv3_1): Conv2d(64, 128, kernel_size=3, padding=1)
  (bn3_1): BatchNorm2d(128)
  (conv3_2): Conv2d(128, 128, kernel_size=3, padding=1)
  (bn3_2): BatchNorm2d(128)
  (pool3): MaxPool2d(2, 2)
  (dropout3): Dropout2d(0.25)
  
  # Classifier
  (fc1): Linear(128, 256)
  (bn_fc1): BatchNorm1d(256)
  (dropout_fc1): Dropout(0.5)
  (fc2): Linear(256, 128)
  (bn_fc2): BatchNorm1d(128)
  (dropout_fc2): Dropout(0.3)
  (fc3): Linear(128, 1)
)
```

**Total Parameters:** ~150K (efficient for medical imaging)

---

## 📊 Training Specifications

### Data Requirements
- **Input Size:** 64x64x3 RGB images
- **Target:** Lower conjunctiva region of eyes
- **Labels:** Binary (0=Normal, 1=Anemic)
- **Preprocessing:** Automatic via pipeline

### Performance Targets
- **Accuracy:** >85%
- **Sensitivity:** >80% (detect anemia cases)
- **Specificity:** >85% (avoid false positives)
- **AUC-ROC:** >0.90

### Training Recommendations
```python
# Optimizer
optimizer = torch.optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)

# Loss Function
criterion = torch.nn.BCELoss()

# Learning Rate Scheduler
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode='min', factor=0.5, patience=5
)

# Data Augmentation
transforms.Compose([
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(degrees=10),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.RandomResizedCrop(64, scale=(0.8, 1.0)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                        std=[0.229, 0.224, 0.225])
])
```

---

## 🔄 Integration Pipeline

### 1. **Image Processing Flow**
```
Raw Eye Image → Eye Extractor → Conjunctiva ROI → 
Image Enhancer → Resize (64x64) → Normalize → 
Model Inference → Probability → Classification
```

### 2. **Model Loading Code**
```python
import torch
from src.model_pytorch import EnhancedAnemiaNet

# Load trained model
model = EnhancedAnemiaNet()
model.load_state_dict(torch.load('models/best_enhanced.pth', map_location='cpu'))
model.eval()

# Inference
with torch.no_grad():
    output = model(input_tensor)
    probability = output.item()
    is_anemic = probability > 0.5
```

### 3. **Expected Output Format**
```python
{
    "success": True,
    "prediction": "anemic" | "normal",
    "is_anemic": bool,
    "probability": float,  # 0.0-1.0
    "confidence": "high" | "medium" | "low",
    "severity": "mild" | "moderate" | "severe" | null,
    "hemoglobin_level": float,  # estimated g/dL
    "recommendation": str
}
```

---

## 📁 File Structure for Training

```
backend/anemia/
├── src/
│   ├── model_pytorch.py      # ✅ PyTorch model classes
│   ├── pipeline.py           # ✅ Complete inference pipeline
│   ├── eye_extractor.py      # ✅ ROI extraction
│   ├── enhancer.py           # ✅ Image enhancement
│   ├── gradcam.py           # ✅ Explainability
│   ├── config.py            # ✅ Configuration
│   └── audit_logger.py      # ✅ Logging
├── models/
│   └── best_enhanced.pth    # ❌ NEEDED - Your trained model
├── api.py                   # ✅ Production API
└── Dockerfile              # ✅ Container setup
```

---

## 🎯 What We Need From You

### Primary Deliverable
- **File:** `best_enhanced.pth`
- **Format:** PyTorch state_dict
- **Location:** `backend/anemia/models/`

### Training Artifacts (Optional but Helpful)
1. **Training Metrics**
   - Loss curves (train/validation)
   - Accuracy curves
   - Confusion matrix
   - ROC curve and AUC

2. **Model Metadata**
   - Final epoch number
   - Best validation accuracy
   - Training time
   - Dataset size used

3. **Validation Results**
   - Test set performance
   - Per-class metrics
   - Sample predictions

---

## 🧪 Testing Your Model

### Quick Test Script
```python
# Test the trained model
import torch
from src.model_pytorch import EnhancedAnemiaNet

# Load your model
model = EnhancedAnemiaNet()
model.load_state_dict(torch.load('models/best_enhanced.pth'))
model.eval()

# Test with dummy data
dummy_input = torch.randn(1, 3, 64, 64)
with torch.no_grad():
    output = model(dummy_input)
    print(f"Model output: {output.item():.4f}")
    print(f"Prediction: {'Anemic' if output.item() > 0.5 else 'Normal'}")
```

### Integration Test
```bash
# Test the complete pipeline
cd backend/anemia
python -c "
from src.pipeline import get_pipeline
pipeline = get_pipeline()
print('Pipeline loaded successfully!')
"
```

---

## 🚀 Deployment Ready

### What's Already Done ✅
- ✅ Complete PyTorch model architecture
- ✅ Production-ready API endpoint
- ✅ Image preprocessing pipeline
- ✅ GradCAM explainability
- ✅ Severity classification logic
- ✅ Hemoglobin estimation
- ✅ Audit logging for compliance
- ✅ Docker containerization
- ✅ Health monitoring endpoints

### What We're Waiting For ⏳
- ⏳ Your trained `best_enhanced.pth` file

---

## 📞 Support & Questions

If you need any clarification on:
- Model architecture details
- Training data format
- Integration requirements
- Performance expectations

Just let us know! The entire pipeline is ready - we just need your trained model file to complete the deployment.

**Good luck with the training!** 🎯

---

**Status:** All infrastructure ready, waiting for trained model  
**Priority:** Quality over speed - take the time needed for good results!