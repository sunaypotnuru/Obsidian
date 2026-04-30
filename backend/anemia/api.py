from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import numpy as np
import cv2
from pathlib import Path
import sys
import logging

# Add src to path so we can import the pipeline and its dependencies
sys.path.append(str(Path(__file__).parent / "src"))
from pipeline import get_pipeline

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="NetraAI Anemia Service")


@app.on_event("startup")
async def startup_event():
    """Verify critical files exist at startup."""
    from pathlib import Path

    # Check model file
    model_path = Path("models/best_model.pt")
    if not model_path.exists():
        logger.warning(f"Model file not found at {model_path}")
        logger.warning("Service will use FallbackPipeline for predictions.")
    else:
        logger.info(
            f"✓ Model file verified: {model_path} ({model_path.stat().st_size / 1024 / 1024:.1f} MB)"
        )

    # Verify face landmarker model
    face_model_path = Path("models/face_landmarker.task")
    if not face_model_path.exists():
        logger.warning(f"MediaPipe face model not found at {face_model_path}")
        logger.warning("Conjunctiva validation may be limited")
    else:
        logger.info(f"✓ Face landmarker verified: {face_model_path}")

    # Test model loading
    try:
        from src.pipeline import get_pipeline

        _ = get_pipeline()  # Initialize pipeline to verify it works
        logger.info("✓ Pipeline initialized successfully")
    except Exception as e:
        logger.error(f"CRITICAL: Failed to initialize pipeline: {e}")
        raise RuntimeError(f"Pipeline initialization failed: {e}")


class PredictRequest(BaseModel):
    image_url: Optional[str] = None
    patient_id: Optional[str] = None
    scan_id: Optional[str] = None


@app.post("/predict")
async def predict(
    fastapi_req: Request,
    file: UploadFile = File(None),
):
    """
    Handle both File upload and JSON URL requests with comprehensive validation.
    """
    try:
        img = None
        filename = "unknown.jpg"

        if file:
            logger.info(f"Received file upload prediction: {file.filename}")
            contents = await file.read()

            # Validate file size (max 10MB)
            MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
            if len(contents) > MAX_FILE_SIZE:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "error": f"File too large. Maximum size is 10MB, got {len(contents) / 1024 / 1024:.1f}MB",
                    },
                )

            # Validate minimum file size (avoid empty/corrupted files)
            MIN_FILE_SIZE = 1024  # 1KB
            if len(contents) < MIN_FILE_SIZE:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "error": "File too small. Minimum size is 1KB"},
                )

            # Decode image
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Validate image was decoded successfully
            if img is None:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "error": "Invalid image format. Please upload a valid image file (JPEG, PNG)",
                    },
                )

            # Validate image dimensions
            height, width = img.shape[:2]
            MIN_DIMENSION = 64
            MAX_DIMENSION = 4096
            if height < MIN_DIMENSION or width < MIN_DIMENSION:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "error": f"Image too small. Minimum dimensions: {MIN_DIMENSION}x{MIN_DIMENSION}px, got {width}x{height}px",
                    },
                )

            if height > MAX_DIMENSION or width > MAX_DIMENSION:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "error": f"Image too large. Maximum dimensions: {MAX_DIMENSION}x{MAX_DIMENSION}px, got {width}x{height}px",
                    },
                )

            # Validate image format (check if it's actually an image)
            if len(img.shape) < 2:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "error": "Invalid image format. Image must have at least 2 dimensions",
                    },
                )

            # Check for corrupted image (all black or all white)
            mean_intensity = img.mean()
            if mean_intensity < 5 or mean_intensity > 250:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "error": "Image appears corrupted (too dark or too bright). Please upload a clear image",
                    },
                )

            filename = file.filename
        else:
            # Try to parse json body manually since FastAPI rejects mixed File/JSON
            try:
                body = await fastapi_req.json()
                image_url = body.get("image_url")
            except Exception:
                image_url = None

            if image_url:
                logger.info(f"Received URL prediction request: {image_url}")
                import httpx

                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.get(image_url)
                    if resp.status_code == 200:
                        nparr = np.frombuffer(resp.content, np.uint8)
                        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                        filename = Path(image_url).name
                    else:
                        return JSONResponse(
                            status_code=400,
                            content={
                                "success": False,
                                "error": f"Failed to fetch image from URL: {resp.status_code}",
                            },
                        )

        if img is None:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Invalid image or missing input"},
            )

        pipeline = get_pipeline()
        result = pipeline.predict(
            img, save_heatmap=False, save_original=False, save_cropped=False, image_source=filename
        )

        if not result.get("success", False):
            return JSONResponse(status_code=500, content=result)

        # Standardize response format for the backend
        is_fallback = result.get("is_fallback", False)
        diagnosis = result.get("diagnosis", "INCONCLUSIVE")
        
        return {
            "success": True,
            "is_fallback": is_fallback,
            "prediction": diagnosis.lower(),
            "is_anemic": result.get("is_anemic"),
            "probability": result.get("probability"),
            "confidence": result.get("confidence", 0.0),
            "severity": result.get("severity", "Unknown"),
            "hemoglobin_level": result.get("hemoglobin_estimate"),
            "recommendation": result.get("error") if is_fallback else (
                "Please consult a doctor for a definitive diagnosis."
                if result.get("is_anemic")
                else "Your results appear normal, but maintain a healthy diet."
            ),
        }

    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}", exc_info=True)
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "anemia-service"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
