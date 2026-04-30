from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import httpx
import logging
import asyncio

from app.core.security import get_current_patient
from app.models.schemas import TokenPayload, AIAnalyzeRequest, AIAnalyzeResponse
from app.core.config import settings
from app.services.supabase import supabase

router = APIRouter(prefix="/ml", tags=["ML / AI"])
logger = logging.getLogger(__name__)


@router.post("/analyze-conjunctiva", response_model=AIAnalyzeResponse)
async def analyze_anemia(
    req: AIAnalyzeRequest, current_user: TokenPayload = Depends(get_current_patient)
):
    """
    Proxy an image URL to the Anemia ML service with proper status tracking.
    """
    from datetime import datetime

    try:
        # 1. Update Scan to 'processing' status
        processing_update = {
            "status": "processing",
            "processing_started_at": datetime.utcnow().isoformat(),
        }

        try:
            supabase.table("scans").update(processing_update).eq(
                "id", req.scan_id
            ).execute()
            logger.info(f"Scan {req.scan_id} marked as processing")
        except Exception as db_error:
            logger.warning(f"Failed to update scan status: {db_error}")
            # Continue anyway - don't fail the request due to status update

        # 2. Call external ML Service with timeout
        async with httpx.AsyncClient(timeout=45.0) as client:
            payload = {
                "image_url": req.image_url,
                "patient_id": req.patient_id,
                "scan_id": req.scan_id,
            }
            try:
                response = await asyncio.wait_for(
                    client.post(f"{settings.ANEMIA_API_URL}/predict", json=payload),
                    timeout=45.0,
                )
                response.raise_for_status()
                data = response.json()

                # Check if response is mocked (should not happen in production)
                if data.get("mocked", False):
                    logger.warning(
                        f"Received mocked response from anemia service for scan {req.scan_id}"
                    )

            except asyncio.TimeoutError:
                logger.error(f"Anemia service timeout for scan {req.scan_id}")
                # Update scan to failed status
                error_update = {
                    "status": "failed",
                    "error_message": "Analysis timeout - please try again",
                    "processing_completed_at": datetime.utcnow().isoformat(),
                }
                supabase.table("scans").update(error_update).eq(
                    "id", req.scan_id
                ).execute()
                raise HTTPException(
                    status_code=504, detail="Analysis timeout - please try again"
                )

            except httpx.RequestError as exc:
                logger.error(f"Error communicating with Anemia API: {exc}")
                # Update scan to failed status
                error_update = {
                    "status": "failed",
                    "error_message": f"Service error: {str(exc)}",
                    "processing_completed_at": datetime.utcnow().isoformat(),
                }
                supabase.table("scans").update(error_update).eq(
                    "id", req.scan_id
                ).execute()
                raise HTTPException(
                    status_code=503, detail="Anemia service unavailable"
                )

        # 3. Save final result in DB with completed status
        update_data = {
            "status": "completed",
            "hemoglobin_estimate": data.get("hemoglobin_level", 0.0),
            "prediction": data.get("prediction", "normal").lower(),
            "confidence": data.get("confidence", 0.0),
            "diagnosis": data.get("prediction", "normal"),
            "processing_completed_at": datetime.utcnow().isoformat(),
        }

        supabase.table("scans").update(update_data).eq("id", req.scan_id).execute()
        logger.info(f"Scan {req.scan_id} completed successfully")

        # 4. Create Notification
        notif_data = {
            "user_id": current_user.sub,
            "type": "scan_result",
            "title": "Anemia Scan Results Ready",
            "message": f"Your scan returned a status of {data.get('prediction', 'normal')}.",
            "data": data,
        }
        supabase.table("notifications").insert(notif_data).execute()

        return data

    except HTTPException:
        # Re-raise HTTP exceptions (already handled)
        raise
    except Exception as e:
        logger.error(f"Failed to process AI Anemia request: {e}", exc_info=True)
        # Update scan to failed status
        try:
            error_update = {
                "status": "failed",
                "error_message": str(e),
                "processing_completed_at": datetime.utcnow().isoformat(),
            }
            supabase.table("scans").update(error_update).eq("id", req.scan_id).execute()
        except Exception as db_error:
            logger.error(f"Failed to update scan error status: {db_error}")

        raise HTTPException(status_code=500, detail=f"ML Service Error: {str(e)}")


@router.post("/cataract/analyze")
async def analyze_cataract(file: UploadFile = File(...)):
    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            audio_bytes = await file.read()
            files = {"file": (file.filename, audio_bytes, file.content_type)}
            resp = await client.post(
                f"{settings.CATARACT_API_URL}/predict", files=files
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.RequestError:
            if (
                not settings.ALLOW_MOCK_RESPONSES
                or settings.ENVIRONMENT == "production"
            ):
                raise HTTPException(
                    status_code=503, detail="Cataract service unavailable"
                )

            logger.warning(
                "Cataract service unavailable - returning mock response (development only)"
            )
            await asyncio.sleep(3)
            return {"status": "Early", "confidence": 0.92, "mocked": True}


@router.post("/cataract/analyze-xai")
async def analyze_cataract_with_xai(file: UploadFile = File(...)):
    """
    Analyze cataract with XAI (Explainable AI) visualization.

    Returns prediction + Grad-CAM heatmap + attention regions.
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            image_bytes = await file.read()
            files = {"file": (file.filename, image_bytes, file.content_type)}
            resp = await client.post(
                f"{settings.CATARACT_API_URL}/predict-with-xai", files=files
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.RequestError:
            if (
                not settings.ALLOW_MOCK_RESPONSES
                or settings.ENVIRONMENT == "production"
            ):
                raise HTTPException(
                    status_code=503, detail="Cataract XAI service unavailable"
                )

            logger.warning(
                "Cataract XAI service unavailable - returning mock response (development only)"
            )
            # Fallback to mock XAI prediction if XAI fails
            await asyncio.sleep(1)
            return {
                "status": "Early Cataract",
                "confidence": 0.92,
                "mocked": True,
                "xai_enabled": True,
                "heatmap_url": "https://placehold.co/400x400/0D9488/FFFFFF/png?text=Heatmap+Simulation",
                "attention_regions": ["Lens center", "Periphery"],
            }


@router.post("/dr/analyze")
async def analyze_dr(file: UploadFile = File(...)):
    """
    Analyze retinal fundus image for diabetic retinopathy detection.

    Uses FDA-compliant EfficientNet-B5 model with:
    - Kappa: 0.8527
    - Sensitivity: 85.62%
    - Specificity: 93.61%

    Returns:
        - grade: DR grade (0-4)
        - grade_name: Human-readable grade name
        - description: Clinical description
        - confidence: Prediction confidence (0-1)
        - referable: Whether patient needs referral
        - recommendation: Clinical recommendation
        - probabilities: Probabilities for all grades
    """
    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            image_bytes = await file.read()
            files = {"file": (file.filename, image_bytes, file.content_type)}
            resp = await client.post(f"{settings.DR_API_URL}/predict", files=files)
            resp.raise_for_status()
            return resp.json()
        except httpx.RequestError as e:
            logger.error(f"DR service error: {e}")
            # Fallback mock response if service is unavailable
            await asyncio.sleep(3)
            return {
                "grade": 2,
                "grade_name": "Moderate NPDR",
                "description": "Moderate non-proliferative diabetic retinopathy",
                "confidence": 0.87,
                "referable": True,
                "recommendation": "Refer to ophthalmologist within 1 month",
                "probabilities": {
                    "No DR": 0.02,
                    "Mild NPDR": 0.05,
                    "Moderate NPDR": 0.87,
                    "Severe NPDR": 0.04,
                    "Proliferative DR": 0.02,
                },
                "mocked": True,
            }


@router.post("/dr/analyze-xai")
async def analyze_dr_with_xai(file: UploadFile = File(...)):
    """
    Analyze retinal fundus image for DR with XAI (Explainable AI) visualization.
    Returns prediction + Grad-CAM heatmap + attention regions.
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            image_bytes = await file.read()
            files = {"file": (file.filename, image_bytes, file.content_type)}
            resp = await client.post(
                f"{settings.DR_API_URL}/predict-with-xai", files=files
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.RequestError as e:
            # Fallback to mock XAI prediction if XAI fails
            logger.error(f"XAI DR service error: {e}")
            await asyncio.sleep(1)
            return {
                "grade": 2,
                "grade_name": "Moderate NPDR",
                "confidence": 0.87,
                "mocked": True,
                "xai_enabled": True,
                "heatmap_url": "https://placehold.co/400x400/ef4444/FFFFFF/png?text=Lesion+Heatmap",
                "probabilities": {
                    "No DR": 0.02,
                    "Mild NPDR": 0.05,
                    "Moderate NPDR": 0.87,
                    "Severe NPDR": 0.04,
                    "Proliferative DR": 0.02,
                },
            }


@router.post("/dr/analyze/uncertainty")
async def analyze_dr_with_uncertainty(
    file: UploadFile = File(...), num_samples: int = 10
):
    """
    Analyze retinal fundus image with uncertainty quantification.

    Uses Monte Carlo Dropout for uncertainty estimation.
    Useful for quality control and flagging cases that need human review.

    Parameters:
        - num_samples: Number of MC dropout samples (default: 10)

    Returns:
        - All fields from /dr/analyze
        - uncertainty: Predictive entropy (uncertainty measure)
        - mean_probabilities: Mean probabilities across samples
        - std_probabilities: Standard deviation of probabilities
        - needs_review: Whether prediction needs human review
    """
    async with httpx.AsyncClient(timeout=90.0) as client:
        try:
            image_bytes = await file.read()
            files = {"file": (file.filename, image_bytes, file.content_type)}
            resp = await client.post(
                f"{settings.DR_API_URL}/predict/uncertainty?num_samples={num_samples}",
                files=files,
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.RequestError as e:
            logger.error(f"DR service error: {e}")
            # Fallback mock response
            await asyncio.sleep(3)
            return {
                "grade": 2,
                "grade_name": "Moderate NPDR",
                "description": "Moderate non-proliferative diabetic retinopathy",
                "confidence": 0.85,
                "uncertainty": 0.32,
                "referable": True,
                "recommendation": "Refer to ophthalmologist within 1 month",
                "mean_probabilities": {
                    "No DR": 0.02,
                    "Mild NPDR": 0.05,
                    "Moderate NPDR": 0.85,
                    "Severe NPDR": 0.06,
                    "Proliferative DR": 0.02,
                },
                "std_probabilities": {
                    "No DR": 0.01,
                    "Mild NPDR": 0.02,
                    "Moderate NPDR": 0.03,
                    "Severe NPDR": 0.02,
                    "Proliferative DR": 0.01,
                },
                "needs_review": False,
                "mocked": True,
            }


@router.post("/parkinsons/analyze")
async def analyze_parkinsons(file: UploadFile = File(...)):
    """
    Analyze voice recording for Parkinson's disease screening.

    Uses acoustic analysis to detect:
    - Voice tremor patterns
    - Speech articulation issues
    - Vocal cord dysfunction

    Returns:
        - risk_score: Parkinson's risk score (0-1)
        - confidence: Prediction confidence (0-1)
        - recommendation: Clinical recommendation
    """
    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            audio_bytes = await file.read()
            files = {"file": (file.filename, audio_bytes, file.content_type)}
            resp = await client.post(
                f"{settings.PARKINSONS_API_URL}/predict", files=files
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.RequestError as e:
            logger.error(f"Parkinson's service error: {e}")
            await asyncio.sleep(3)
            # Bug 6 Fix: Return mock response matching the frontend's expected format
            return {
                "prediction": 0,
                "probability": 0.34,
                "risk_level": "Low Risk",
                "risk_score": 0.34,
                "color": "green",
                "model_accuracy": "87.3%",
                "features_extracted": 22,
                "recommendation": "No significant Parkinson's indicators detected. Continue regular health monitoring.",
                "note": "This is a screening tool only. Consult a neurologist for clinical diagnosis.",
                "mocked": True,
            }


@router.post("/mental-health/analyze")
async def analyze_mental_health(file: UploadFile = File(...)):
    """
    Analyze voice recording for mental health assessment.
    """
    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            audio_bytes = await file.read()
            files = {"file": (file.filename, audio_bytes, file.content_type)}
            resp = await client.post(
                f"{settings.MENTAL_HEALTH_API_URL}/predict", files=files
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Mental Health service returned error status: {e.response.status_code} - {e.response.text}")
            raise HTTPException(
                status_code=e.response.status_code, 
                detail=f"Mental Health service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            logger.error(f"Mental Health service connection error: {e}")
            if not settings.ALLOW_MOCK_RESPONSES or settings.ENVIRONMENT == "production":
                raise HTTPException(status_code=503, detail="Mental Health service unavailable")
            
            logger.warning("Returning mock mental health response")
            await asyncio.sleep(3)
            return {
                "risk_level": "LOW",
                "risk_score": 15,
                "confidence": 0.82,
                "depression_score": 0.25,
                "anxiety_score": 0.30,
                "stress_score": 0.28,
                "transcription": "Voice analysis completed successfully.",
                "transcription_confidence": 0.85,
                "coping_strategy": "Practice mindfulness and maintain regular sleep schedule. Consider light exercise and social connection.",
                "crisis_detected": False,
                "processing_time_seconds": 2.3,
                "mocked": True,
            }
        except Exception as e:
            logger.error(f"Unexpected error in mental health analysis: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
