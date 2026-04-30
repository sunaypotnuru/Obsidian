"""
Batch 7: Native DeepSeek-R1 AI Integration Routes (Open-Source, Self-Hosted).

Provides:
  - POST /ai/triage       → Patient symptom checker (uses local DeepSeek-R1)
  - POST /ai/scribe       → Doctor consultation scribe / SOAP note generator
  - GET  /ai/health       → AI service health check
  - POST /ai/extract-lab-vitals → Lab report OCR and extraction
  - POST /ai/assistant    → Health information assistant

Uses DeepSeek-R1 via Ollama (FREE, runs locally, HIPAA-compliant).
No external API keys required. All data stays on your servers.
"""

import os
import logging
import json
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from pydantic import BaseModel
from typing import Optional
import ollama

from app.core.security import get_current_user
from app.services.supabase import supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])

# DeepSeek-R1 Configuration (Local Ollama)
DEEPSEEK_MODEL = "deepseek-r1:14b"
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")


def _get_ollama_client():
    """Get Ollama client for DeepSeek-R1."""
    try:
        # Test connection
        ollama.list()
        return ollama
    except Exception as e:
        logger.error(f"Ollama connection error: {e}")
        return None


# ─── Request / Response Models ──────────────────────────────────────────────


class TriageRequest(BaseModel):
    symptoms: str | list[str]
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_history: Optional[str] = None
    location: Optional[str] = None


class ScribeRequest(BaseModel):
    consultation_notes: str
    patient_name: Optional[str] = "Patient"
    doctor_name: Optional[str] = "Doctor"
    specialty: Optional[str] = "General Medicine"


class AssistantRequest(BaseModel):
    message: str
    history: list[dict] = []
    patient_context: Optional[str] = ""


# ─── Endpoints ───────────────────────────────────────────────────────────────


@router.get("/health")
async def ai_health():
    """Check if the AI service is configured and available."""
    client = _get_ollama_client()

    if not client:
        return {
            "status": "offline",
            "model": DEEPSEEK_MODEL,
            "provider": "Ollama (Local)",
            "message": "Ollama service not running. Start with: ollama serve",
        }

    try:
        # Check if DeepSeek-R1 model is available
        models = client.list()
        model_names = [m["name"] for m in models.get("models", [])]
        has_deepseek = any("deepseek-r1" in name for name in model_names)

        return {
            "status": "online" if has_deepseek else "model_missing",
            "model": DEEPSEEK_MODEL,
            "provider": "Ollama (Local)",
            "available_models": model_names,
            "message": (
                "AI service ready (FREE, self-hosted)"
                if has_deepseek
                else f"Run: ollama pull {DEEPSEEK_MODEL}"
            ),
        }
    except Exception as e:
        return {
            "status": "error",
            "model": DEEPSEEK_MODEL,
            "provider": "Ollama (Local)",
            "message": f"Error: {str(e)}",
        }


@router.post("/triage")
async def patient_triage(request: TriageRequest, user=Depends(get_current_user)):
    """
    AI-powered symptom triage for patients using DeepSeek-R1.
    Analyzes symptoms and provides structured JSON with urgency and specialty.
    """
    client = _get_ollama_client()

    # Build context for the AI
    age_info = f"Age: {request.age}" if request.age else ""
    gender_info = f"Gender: {request.gender}" if request.gender else ""
    history_info = (
        f"Medical History: {request.medical_history}" if request.medical_history else ""
    )
    context_parts = [p for p in [age_info, gender_info, history_info] if p]
    patient_context = (
        ". ".join(context_parts) if context_parts else "No additional context provided"
    )

    prompt = f"""You are a medical triage assistant with expertise in emergency medicine and clinical decision-making.

Analyze the following patient information and provide a triage assessment.

Patient Context: {patient_context}
Reported Symptoms: {request.symptoms}

Provide your response as a JSON object with the following structure:
{{
  "urgency": "emergency" | "urgent" | "routine",
  "risk_score": 1-10 (integer, where 10 is most severe),
  "risk_level": "low" | "medium" | "high",
  "suggested_specialty": "cardiology" | "neurology" | "general" | etc.,
  "summary": "brief clinical summary",
  "possible_causes": ["cause 1", "cause 2", "cause 3"],
  "immediate_steps": ["step 1", "step 2", "step 3"],
  "when_to_seek_care": "guidance on when to seek emergency care"
}}

Important: Never provide a definitive diagnosis or prescribe medication. Focus on triage and guidance only.

Respond with ONLY the JSON object, no additional text."""

    if not client:
        return {
            "urgency": "routine",
            "risk_score": 1,
            "risk_level": "low",
            "suggested_specialty": "general",
            "summary": "AI service not available. Please consult a doctor.",
            "possible_causes": ["Service unavailable"],
            "immediate_steps": ["Consult a healthcare provider"],
            "when_to_seek_care": "Seek emergency care if symptoms worsen.",
        }

    try:
        response = client.chat(
            model=DEEPSEEK_MODEL,
            messages=[{"role": "user", "content": prompt}],
            format="json",
        )

        triage_data = json.loads(response["message"]["content"])

        # Log to Epidemic Radar if location provided
        if request.location:
            urgency = triage_data.get("urgency", "routine").lower()
            severity = 9 if urgency == "emergency" else 7 if urgency == "urgent" else 3

            try:
                supabase.table("symptom_reports").insert(
                    {
                        "user_id": user.get("sub"),
                        "symptoms": (
                            request.symptoms
                            if isinstance(request.symptoms, list)
                            else [request.symptoms]
                        ),
                        "severity": severity,
                        "location": f"SRID=4326;{request.location}",
                        "anonymized": True,
                    }
                ).execute()
            except Exception as e:
                logger.error(f"Failed to log symptom report: {e}")

        return triage_data

    except Exception as e:
        logger.error(f"DeepSeek triage error: {e}")
        return {
            "urgency": "urgent",
            "risk_score": 7,
            "risk_level": "medium",
            "suggested_specialty": "general",
            "summary": "Service temporarily unavailable. Please consult a doctor.",
            "possible_causes": [f"Error: {str(e)}"],
            "immediate_steps": ["Book a consultation with a healthcare provider"],
            "when_to_seek_care": "Seek emergency care if symptoms worsen rapidly.",
        }


@router.post("/scribe")
async def consultation_scribe(request: ScribeRequest, user=Depends(get_current_user)):
    """
    AI-powered consultation scribe for doctors using DeepSeek-R1.
    Converts rough consultation notes into structured SOAP format.
    """
    if user.get("role") not in ["doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Doctors only"
        )

    client = _get_ollama_client()

    prompt = f"""You are a medical documentation assistant specializing in clinical note generation.

Convert the following rough consultation notes into a structured SOAP format.

Doctor: {request.doctor_name} ({request.specialty})
Patient: {request.patient_name}

Raw Consultation Notes:
---
{request.consultation_notes}
---

Generate a professional clinical summary in SOAP format:

**S - Subjective** (what the patient reports - symptoms, concerns, history)
**O - Objective** (clinical observations, vitals, examination findings, test results)
**A - Assessment** (diagnosis or clinical impression, differential diagnoses)
**P - Plan** (treatment plan, prescriptions, referrals, follow-up instructions)

Also include:
- **Follow-up Date**: Recommended timeframe for next visit
- **Key Action Items**: Bullet list of immediate next steps for patient and care team

Keep it professional, concise, and clinically appropriate. Use medical terminology where appropriate. Fill in reasonable clinical defaults where information is unclear from the notes."""

    if not client:
        return {
            "soap_note": f"""**S - Subjective**
{request.consultation_notes[:200]}...

**O - Objective**
(To be filled based on clinical examination)

**A - Assessment**
(Clinical impression pending AI service availability)

**P - Plan**
(Treatment plan to be documented)

---
⚠️ AI Scribe requires Ollama service to be running.""",
            "ai_powered": False,
            "message": "AI service not available. Start Ollama with: ollama serve",
        }

    try:
        response = client.chat(
            model=DEEPSEEK_MODEL, messages=[{"role": "user", "content": prompt}]
        )

        return {
            "soap_note": response["message"]["content"],
            "ai_powered": True,
            "model": DEEPSEEK_MODEL,
            "provider": "DeepSeek-R1 (Local)",
            "doctor": request.doctor_name,
            "patient": request.patient_name,
        }
    except Exception as e:
        logger.error(f"DeepSeek scribe error: {e}")
        raise HTTPException(
            status_code=503, detail=f"AI service temporarily unavailable: {str(e)}"
        )


@router.post("/extract-lab-vitals")
async def extract_lab_vitals(
    file: UploadFile = File(...), user=Depends(get_current_user)
):
    """
    AI-powered Lab Report OCR and extraction using DeepSeek-R1 with vision.
    Accepts PDF or Images and returns structured JSON with key vitals.

    Note: DeepSeek-R1 14B doesn't have native vision. For OCR, consider:
    1. Using Tesseract OCR first, then DeepSeek for extraction
    2. Using llama3.2-vision or other vision models
    3. Keeping Gemini for this specific use case
    """
    client = _get_ollama_client()

    if not client:
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Start Ollama with: ollama serve",
        )

    try:
        await file.read()  # Read file but don't store contents

        # For now, return a helpful message about OCR limitations
        # In production, integrate Tesseract OCR + DeepSeek or use vision model
        return {
            "success": False,
            "message": "OCR feature requires vision model. Options: 1) Use Tesseract OCR + DeepSeek-R1 for text extraction, 2) Use llama3.2-vision model, 3) Keep Gemini for OCR only",
            "recommendation": "Run: ollama pull llama3.2-vision:11b for vision capabilities",
            "data": {"patient_name": "unknown", "test_date": "unknown", "metrics": []},
        }

    except Exception as e:
        logger.error(f"OCR error: {e}")
        raise HTTPException(
            status_code=503, detail=f"Failed to process document: {str(e)}"
        )


@router.post("/assistant")
async def health_assistant(request: AssistantRequest, user=Depends(get_current_user)):
    """
    AI-Powered persistent health assistant using DeepSeek-R1.
    Provides generic health info strictly avoiding medical diagnosis.
    """
    client = _get_ollama_client()

    if not client:
        return {
            "reply": "AI service is currently unavailable. Please start Ollama service."
        }

    context = (
        f"Patient Context: {request.patient_context}\n"
        if request.patient_context
        else ""
    )

    system_prompt = f"""You are Netra AI, a highly empathetic and helpful health information assistant powered by DeepSeek-R1.
You answer questions based on reputable medical sources and evidence-based medicine.

Strict Guidelines:
1. Under NO circumstances should you provide a definitive medical diagnosis.
2. NEVER prescribe medication or recommend specific drugs.
3. Always include a brief disclaimer that you are an AI assistant and users should consult a licensed healthcare provider for personalized medical advice.
4. Keep answers concise, clear, and supportive. Use bullet points for readability when appropriate.
5. If asked about serious symptoms, always recommend seeking immediate medical attention.
6. Focus on general health education, preventive care, and wellness information.

{context}"""

    try:
        # Format conversation history
        messages = [{"role": "system", "content": system_prompt}]

        for msg in request.history:
            role = "assistant" if msg.get("role") == "assistant" else "user"
            messages.append({"role": role, "content": msg.get("content", "")})

        # Add current message
        messages.append({"role": "user", "content": request.message})

        response = client.chat(model=DEEPSEEK_MODEL, messages=messages)

        return {
            "reply": response["message"]["content"],
            "model": DEEPSEEK_MODEL,
            "provider": "DeepSeek-R1 (Local)",
        }

    except Exception as e:
        logger.error(f"DeepSeek assistant error: {e}")
        return {
            "reply": "I am having trouble processing your request right now. Please try again later.",
            "error": str(e),
        }
