# 🚀 Cataract Service - Quick Start Guide

**Model**: Swin-Base Transformer (96% Sensitivity)  
**Port**: 8005  
**Status**: ✅ Ready to Test

---

## ⚡ Quick Start (3 Steps)

### Step 1: Start the Service
```bash
cd C:\Netra Ai\Netra-Ai
docker-compose up cataract
```

Wait for this message in logs:
```
🚀 Cataract Detection Service is ready!
```

### Step 2: Test the Service
```bash
cd services\cataract
python test_service.py
```

Expected: All tests pass ✅

### Step 3: Test Prediction (Optional)
```bash
curl -X POST http://localhost:8005/predict -F "file=@your_image.jpg"
```

---

## 📊 Quick Reference

### Service URLs
- **Health**: http://localhost:8005/health
- **Model Info**: http://localhost:8005/model-info
- **Predict**: http://localhost:8005/predict (POST)
- **API Docs**: http://localhost:8005/docs

### Model Performance
- **Sensitivity**: 96.0% (detects 96% of cataracts)
- **Specificity**: 90.2% (90% correct on normal)
- **Threshold**: 0.20 (optimized)

### Files
- **Model**: `models/swin_combined_best.pth` (331 MB)
- **Pipeline**: `app/preprocessing_pipeline.py`
- **Detector**: `app/cataract_detector.py`
- **API**: `app/main.py`

---

## ✅ Verification

Service is working if:
- ✅ Health check returns `"status": "healthy"`
- ✅ Model info shows 96% sensitivity
- ✅ Predictions return confidence scores
- ✅ No errors in logs

---

## 🎯 Next Steps

1. **Test**: Run `python test_service.py`
2. **Verify**: Check all tests pass
3. **Commit**: After successful testing
   ```bash
   git add services/cataract/ Catract/
   git commit -m "Implement cataract model (96% sensitivity)"
   git push
   ```

---

**Quick Start Guide** | April 14, 2026
