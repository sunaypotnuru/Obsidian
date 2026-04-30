# 🔍 Missing Model Files Report

## Overview
This document lists all missing AI model files that need to be trained and placed in their respective directories.

---

## ❌ Missing Model Files

### 1. Anemia Detection Model
**Location:** `backend/anemia/models/`  
**Expected File:** `best_enhanced.h5`  
**Type:** TensorFlow/Keras model  
**Status:** ❌ MISSING  
**Training Data Location:** `C:\Netra Ai Training Data\AI-Models\`

**Code Reference:**
```python
# backend/anemia/src/pipeline.py:40
model_path = MODELS_DIR / 'best_enhanced.h5'
self.model = tf.keras.models.load_model(str(model_path))
```

**Action Required:**
- Train anemia detection model using conjunctival images
- Save as `best_enhanced.h5`
- Place in `backend/anemia/models/`

---

### 2. Diabetic Retinopathy Model
**Location:** `backend/diabetic-retinopathy/models/`  
**Expected Files:** 
- `checkpoint_latest.pth` (primary)
- `best_model_industrial.pth` (fallback)

**Type:** PyTorch model  
**Status:** ❌ MISSING  
**Architecture:** EfficientNet-B5 based

**Code Reference:**
```python
# backend/diabetic-retinopathy/app/main.py:145-148
model_path = Path("/app/models/checkpoint_latest.pth")
if not model_path.exists():
    model_path = Path("/app/models/best_model_industrial.pth")
```

**Action Required:**
- Train DR detection model (5-class classification)
- Save checkpoint as `checkpoint_latest.pth`
- Place in `backend/diabetic-retinopathy/models/`

---

### 3. Parkinson's Voice Analysis Model
**Location:** `backend/parkinsons-voice/models/`  
**Expected Files:**
- `model.pkl` (main model)
- `scaler.json` (feature scaler)
- `metrics.json` (model metrics)

**Type:** Scikit-learn model  
**Status:** ❌ MISSING

**Code Reference:**
```python
# backend/parkinsons-voice/app/main.py:69-81
self.model = joblib.load(self.model_dir / 'model.pkl')
with open(self.model_dir / 'scaler.json', 'r') as f:
    scaler_data = json.load(f)
with open(self.model_dir / 'metrics.json', 'r') as f:
    self.metrics = json.load(f)
```

**Action Required:**
- Train Parkinson's detection model using voice features
- Save model as `model.pkl`
- Save scaler as `scaler.json`
- Save metrics as `metrics.json`
- Place in `backend/parkinsons-voice/models/`

---

### 4. Mental Health Analysis Model
**Location:** `backend/mental-health/models/`  
**Expected Files:** None (uses Whisper API)  
**Status:** ✅ OK (uses OpenAI Whisper, no local model needed)

---

## ✅ Present Model Files

### 1. Cataract Detection Model
**Location:** `backend/cataract/models/`  
**File:** `swin_combined_best.pth`  
**Type:** PyTorch (Swin Transformer)  
**Status:** ✅ PRESENT  
**Size:** Check file size

---

## 📊 Summary

| Model | Location | File | Status |
|-------|----------|------|--------|
| Anemia Detection | `backend/anemia/models/` | `best_enhanced.h5` | ❌ MISSING |
| Diabetic Retinopathy | `backend/diabetic-retinopathy/models/` | `checkpoint_latest.pth` | ❌ MISSING |
| Parkinson's Voice | `backend/parkinsons-voice/models/` | `model.pkl` | ❌ MISSING |
| Cataract Detection | `backend/cataract/models/` | `swin_combined_best.pth` | ✅ PRESENT |
| Mental Health | N/A | Uses Whisper API | ✅ OK |

**Total Models:** 5  
**Present:** 2 (40%)  
**Missing:** 3 (60%)

---

## 🎯 Action Plan

### Priority 1: Critical Models (Required for Core Features)
1. **Anemia Detection** - Primary feature
   - Train using conjunctival images
   - Target accuracy: > 90%
   - Save as `best_enhanced.h5`

2. **Diabetic Retinopathy** - Important screening feature
   - Train using retinal fundus images
   - 5-class classification (No DR, Mild, Moderate, Severe, Proliferative)
   - Target accuracy: > 95%
   - Save as `checkpoint_latest.pth`

### Priority 2: Additional Features
3. **Parkinson's Voice Analysis** - Voice-based screening
   - Train using voice recordings
   - Extract acoustic features (jitter, shimmer, HNR, etc.)
   - Target accuracy: 85-92%
   - Save as `model.pkl` + `scaler.json` + `metrics.json`

---

## 📝 Training Data Requirements

### Anemia Detection
- **Dataset:** Conjunctival images (anemic vs non-anemic)
- **Size:** Minimum 1000+ images per class
- **Format:** JPG/PNG
- **Labels:** Binary (anemic/non-anemic) or multi-class (severity levels)

### Diabetic Retinopathy
- **Dataset:** Retinal fundus images
- **Size:** Minimum 5000+ images across 5 classes
- **Format:** JPG/PNG
- **Labels:** 5 classes (0-4: No DR to Proliferative DR)
- **Recommended:** Use public datasets (Kaggle DR, APTOS, etc.)

### Parkinson's Voice
- **Dataset:** Voice recordings (sustained vowels, speech)
- **Size:** Minimum 500+ recordings (PD vs healthy)
- **Format:** WAV/MP3
- **Features:** Acoustic features (jitter, shimmer, HNR, RPDE, DFA, PPE)

---

## 🔧 Model Training Scripts

### Anemia Detection
```bash
# Navigate to anemia directory
cd backend/anemia

# Train model (script needs to be created)
python train_model.py --data /path/to/training/data --output models/best_enhanced.h5
```

### Diabetic Retinopathy
```bash
# Navigate to DR directory
cd backend/diabetic-retinopathy

# Train model (script needs to be created)
python train_model.py --data /path/to/training/data --output models/checkpoint_latest.pth
```

### Parkinson's Voice
```bash
# Navigate to Parkinson's directory
cd backend/parkinsons-voice

# Train model (script needs to be created)
python train_model.py --data /path/to/training/data --output models/
```

---

## 🚨 Impact on Deployment

### Without Missing Models:
- ❌ Anemia detection API will fail
- ❌ Diabetic retinopathy screening unavailable
- ❌ Parkinson's voice analysis unavailable
- ✅ Cataract detection works
- ✅ Mental health analysis works (uses Whisper API)

### Recommendation:
**DO NOT deploy to production until at least Priority 1 models are trained and tested.**

---

## 📞 Next Steps

1. **Gather Training Data**
   - Collect or acquire datasets for each model
   - Ensure data quality and proper labeling
   - Split into train/val/test sets

2. **Train Models**
   - Set up training environment (GPU recommended)
   - Train each model with proper validation
   - Achieve target accuracy metrics

3. **Validate Models**
   - Test on held-out test set
   - Verify performance metrics
   - Test with real-world data

4. **Deploy Models**
   - Place trained models in respective directories
   - Test API endpoints
   - Verify predictions are correct

5. **Monitor Performance**
   - Track prediction accuracy
   - Monitor inference time
   - Collect user feedback

---

## 📚 Resources

### Training Data Sources
- **Kaggle:** https://www.kaggle.com/datasets
- **UCI ML Repository:** https://archive.ics.uci.edu/ml/
- **Medical Image Databases:** Various public medical imaging datasets

### Model Training Guides
- **TensorFlow/Keras:** https://www.tensorflow.org/tutorials
- **PyTorch:** https://pytorch.org/tutorials/
- **Scikit-learn:** https://scikit-learn.org/stable/tutorial/

---

**Last Updated:** April 29, 2026  
**Status:** 3 models missing, training required before production deployment
