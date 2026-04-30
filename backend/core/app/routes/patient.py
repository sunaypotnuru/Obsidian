from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime
import uuid
import httpx
import logging
from app.core.config import settings
from app.core.security import get_current_patient
from app.models.schemas import TokenPayload, PrescriptionResponse, AppointmentCreate
from app.services.supabase import supabase
from app.utils.file_security import SecureFileUpload
from app.services.achievements import record_achievement_progress
from app.db.schema import Tables, Col
import asyncio
from twilio.rest import Client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/patient", tags=["Patient"])


@router.get("/dashboard")
async def get_dashboard(current_user: TokenPayload = Depends(get_current_patient)):
    """Fetch aggregated dashboard data for the patient."""
    try:
        logger.debug("Dashboard request started")
        # Get profile
        profile_res = (
            supabase.table("profiles_patient")
            .select("id, full_name, email, avatar_url, health_score")
            .eq("id", current_user.sub)
            .execute()
        )
        if not profile_res.data:
            # Auto-create profile if missing (due to no DB trigger on signup)
            meta: Dict[str, Any] = {}
            try:
                if settings.BYPASS_AUTH:
                    meta = {}
                else:
                    user_auth = supabase.auth.admin.get_user_by_id(current_user.sub)
                    meta = (
                        user_auth.user.user_metadata
                        if user_auth and user_auth.user
                        else {}
                    )
            except Exception as auth_err:
                logger.warning(f"Could not fetch user metadata: {auth_err}")
                meta = {}

            name = (
                meta.get("full_name")
                or meta.get("name")
                or current_user.email
                or "Demo Patient"
            )

            new_profile = {
                "id": current_user.sub,
                "email": current_user.email,
                "full_name": name,
                "blood_type": meta.get("blood_group", "O+"),
                "age": 25,
                "gender": "other",
            }
            try:
                supabase.table("profiles_patient").insert(new_profile).execute()
            except Exception as insert_err:
                logger.warning(f"Could not insert profile: {insert_err}")
            profile = new_profile
        else:
            profile = profile_res.data[0]

        # Get upcoming appointments — NO FK join to avoid PGRST200 relationship errors
        today = datetime.now().isoformat()
        try:
            appts_res = (
                supabase.table("appointments")
                .select(
                    "id, patient_id, doctor_id, scheduled_at, status, type, reason, created_at"
                )
                .eq("patient_id", current_user.sub)
                .gte("scheduled_at", today)
                .order("scheduled_at")
                .limit(5)
                .execute()
            )
            upcoming_appts = appts_res.data or []
            # Enrich with doctor profiles separately
            if upcoming_appts:
                doctor_ids = list(
                    set([a["doctor_id"] for a in upcoming_appts if a.get("doctor_id")])
                )
                try:
                    docs_res = (
                        supabase.table("profiles_doctor")
                        .select("id, full_name, specialty, avatar_url")
                        .in_("id", doctor_ids)
                        .execute()
                    )
                    docs_map = {d["id"]: d for d in (docs_res.data or [])}
                    for apt in upcoming_appts:
                        doc = docs_map.get(apt.get("doctor_id"), {})
                        apt["profiles_doctor"] = {
                            "name": doc.get("full_name", "Doctor"),
                            "specialty": doc.get("specialty", ""),
                            "avatar_url": doc.get("avatar_url"),
                        }
                except Exception:
                    for apt in upcoming_appts:
                        apt["profiles_doctor"] = {
                            "name": "Doctor",
                            "specialty": "",
                            "avatar_url": None,
                        }
        except Exception as appt_err:
            logger.warning(f"Could not fetch appointments: {appt_err}")
            upcoming_appts = []

        # Get recent scans
        try:
            scans_res = (
                supabase.table("scans")
                .select(
                    "id, patient_id, image_url, prediction, confidence, hemoglobin_estimate, created_at"
                )
                .eq("patient_id", current_user.sub)
                .order("created_at", desc=True)
                .limit(3)
                .execute()
            )
            # Map database fields to frontend expectations
            recent_scans = []
            for scan in scans_res.data or []:
                # Map anemia_status enum to frontend format
                prediction_val = scan.get("prediction", "normal")
                if prediction_val in ["mild", "moderate", "severe"]:
                    prediction_str = "anemic"
                else:
                    prediction_str = "normal"

                recent_scans.append(
                    {
                        "id": scan["id"],
                        "patient_id": scan["patient_id"],
                        "image_url": scan["image_url"],
                        "prediction": prediction_str,
                        "confidence": scan.get("confidence", 0),
                        "hemoglobin_level": scan.get("hemoglobin_estimate"),
                        "created_at": scan["created_at"],
                    }
                )
        except Exception as scan_err:
            logger.warning(f"Could not fetch scans: {scan_err}")
            recent_scans = []

        # Get recent prescriptions (table may not exist yet)
        try:
            rx_res = (
                supabase.table("prescriptions")
                .select("*")
                .eq("patient_id", current_user.sub)
                .order("created_at", desc=True)
                .limit(2)
                .execute()
            )
            prescriptions = rx_res.data or []
        except Exception as rx_err:
            logger.warning(
                f"Could not fetch prescriptions (table may not exist): {rx_err}"
            )
            prescriptions = []

        logger.debug("Dashboard request completed successfully")
        return {
            "profile": profile,
            "upcoming_appointments": upcoming_appts,
            "recent_scans": recent_scans,
            "prescriptions": prescriptions,
        }
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scans")
async def get_scans(current_user: TokenPayload = Depends(get_current_patient)):
    """Get all scans for the patient."""
    res = (
        supabase.table("scans")
        .select("id, hemoglobin_estimate, recommendations, created_at")
        .eq("patient_id", current_user.sub)
        .order("created_at", desc=True)
        .execute()
    )

    # Map database fields to frontend expectations
    scans = []
    for scan in res.data or []:
        img_url = scan.get("image_url")
        if img_url and not img_url.startswith("http"):
            try:
                # Request a signed URL from storage
                res_signed = supabase.storage.from_("scan-images").create_signed_url(
                    img_url, 3600
                )
                if isinstance(res_signed, dict) and "signedURL" in res_signed:
                    img_url = res_signed["signedURL"]
                elif hasattr(res_signed, "signed_url"):
                    img_url = res_signed.signed_url
                elif isinstance(res_signed, str):
                    img_url = res_signed
            except Exception as e:
                logger.warning(
                    f"Failed to generate signed URL for scan {scan.get('id')}: {e}"
                )

        scans.append(
            {
                "id": scan["id"],
                "patient_id": scan["patient_id"],
                "image_url": img_url,
                "prediction": scan.get("prediction", "normal"),
                "confidence": scan.get("confidence", 0),
                "confidence_score": scan.get(
                    "confidence", 0
                ),  # Alias for compatibility
                "hemoglobin_level": scan.get(
                    "hemoglobin_estimate"
                ),  # Map to frontend field name
                "hemoglobin_estimate": scan.get("hemoglobin_estimate"),  # Keep original
                "recommendations": scan.get("recommendations"),
                "created_at": scan["created_at"],
            }
        )

    return scans


@router.post("/scans/upload")
async def upload_scan(
    file: UploadFile = File(...),
    current_user: TokenPayload = Depends(get_current_patient),
):
    """Upload an eye image with comprehensive security validation."""
    try:
        # Import secure file validation

        # Comprehensive security validation
        content = await SecureFileUpload.validate_image_upload(file)

        # Additional medical image validation
        if len(content) < 1024:
            # Minimum 1KB for valid image
            raise HTTPException(status_code=400, detail="Image file too small")

        # Generate secure filename
        secure_filename = SecureFileUpload.generate_secure_filename(
            file.filename, current_user.sub
        )

        # 1. Forward to AI model with timeout and error handling
        ai_result: Dict[str, Any] = {
            "prediction": "normal",
            "confidence": 0.0,
            "hemoglobin_level": None,
            "recommendations": "Analysis pending or fallback mode active.",
            "is_fallback": True
        }

        try:
            # Proxy to the real ML API with strict timeout
            async with httpx.AsyncClient(timeout=30.0) as client:
                files = {"file": (secure_filename, content, file.content_type)}
                ai_response = await client.post(
                    f"{settings.ANEMIA_API_URL}/predict", files=files
                )
                if ai_response.status_code == 200:
                    ai_result = ai_response.json()
                    # Validate AI response structure
                    required_fields = ["prediction", "confidence"]
                    if not all(field in ai_result for field in required_fields):
                        logger.error("AI service returned invalid response structure")
                        ai_result["is_fallback"] = True
                    
                    # Ensure recommendations field is mapped correctly from the AI service response
                    if "recommendation" in ai_result and "recommendations" not in ai_result:
                        ai_result["recommendations"] = ai_result["recommendation"]
                else:
                    logger.error(
                        f"AI Service returned error: {ai_response.status_code}"
                    )
                    ai_result["is_fallback"] = True
        except httpx.TimeoutException:
            logger.error("AI Service timeout - using fallback result")
            ai_result["is_fallback"] = True
        except httpx.ConnectError:
            logger.error("AI Service connection failed - using fallback result")
            ai_result["is_fallback"] = True
        except Exception as e:
            logger.error(f"AI Service error: {str(e)}")
            ai_result["is_fallback"] = True

        # 2. Secure upload to Supabase Storage
        file_path = f"scans/{current_user.sub}/{secure_filename}"

        try:
            # Upload to Supabase Storage
            # In supabase-py 2.x, this returns the file path or raises an exception
            supabase.storage.from_("scan-images").upload(
                file_path,
                content,
                {
                    "content-type": file.content_type,
                    "cache-control": "3600",
                    "x-upsert": "false",
                },
            )
            # Store the relative path in the database.
            # We will generate signed URLs dynamically when fetching.
            file_url = file_path

        except Exception as storage_error:
            logger.error(f"Storage error: {storage_error}")
            # Fallback to a placeholder if upload failed entirely
            file_url = "https://placehold.co/600x400?text=Scan+Upload+Error"

        # 3. Save to database with input validation
        # Final data preparation for DB - ONLY include columns that exist in the DB schema
        scan_data = {
            Col.Scans.PATIENT_ID: current_user.sub,
            Col.Scans.SCAN_TYPE: "anemia",
            Col.Scans.IMAGE_URL: file_url,
            Col.Scans.PREDICTION: str(ai_result.get("prediction", "normal"))[:50],  # Limit length
            Col.Scans.CONFIDENCE: float(ai_result.get("confidence")) if ai_result.get("confidence") is not None else 0.0,
            Col.Scans.HEMOGLOBIN_ESTIMATE: ai_result.get("hemoglobin_level"),
            Col.Scans.RECOMMENDATIONS: ai_result.get("recommendations") or ai_result.get("recommendation"),
        }

        # Validate hemoglobin estimate range
        try:
            hb_val = ai_result.get("hemoglobin_level")
            if hb_val is not None:
                hb_float = float(hb_val)
                if 0 <= hb_float <= 25:
                    scan_data["hemoglobin_estimate"] = hb_float
                else:
                    scan_data["hemoglobin_estimate"] = None
            else:
                scan_data["hemoglobin_estimate"] = None
        except (TypeError, ValueError):
            scan_data["hemoglobin_estimate"] = None

        db_res = supabase.table("scans").insert(scan_data).execute()

        if not db_res.data:
            raise HTTPException(status_code=500, detail="Failed to save scan record")

        # Return with frontend-compatible field names
        result: Dict[str, Any] = (
            db_res.data[0] if isinstance(db_res.data[0], dict) else dict(db_res.data[0])
        )
        result["confidence_score"] = result.get("confidence")  # Alias

        # Record achievements asynchronously (with error handling)
        try:
            asyncio.create_task(
                record_achievement_progress(current_user.sub, "HEALTH_TRACKER", 1)
            )
            asyncio.create_task(
                record_achievement_progress(current_user.sub, "IRON_WARRIOR", 1)
            )
        except Exception as achievement_error:
            logger.warning(f"Achievement recording failed: {achievement_error}")

        # Log successful upload (without sensitive data)
        logger.info(f"Scan uploaded successfully for user: {current_user.sub[:8]}***")

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Scan upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Upload failed due to server error")


@router.get("/appointments")
async def get_appointments(current_user: TokenPayload = Depends(get_current_patient)):
    """Get all appointments for the patient."""
    try:
        res = (
            supabase.table("appointments")
            .select("id, patient_id, doctor_id, scheduled_at, status, type, reason, notes, created_at")
            .eq("patient_id", current_user.sub)
            .order("scheduled_at", desc=True)
            .execute()
        )
        
        appointments = res.data or []
        if appointments:
            # Enrich with doctor profiles separately to avoid relationship errors
            doctor_ids = list(set([a["doctor_id"] for a in appointments if a.get("doctor_id")]))
            if doctor_ids:
                docs_res = (
                    supabase.table("profiles_doctor")
                    .select("id, full_name, specialty, avatar_url")
                    .in_("id", doctor_ids)
                    .execute()
                )
                docs_map = {d["id"]: d for d in (docs_res.data or [])}
                for a in appointments:
                    doc_id = a.get("doctor_id")
                    if doc_id in docs_map:
                        a["profiles_doctor"] = {
                            "name": docs_map[doc_id].get("full_name"),
                            "specialty": docs_map[doc_id].get("specialty"),
                            "avatar_url": docs_map[doc_id].get("avatar_url")
                        }
        return appointments
    except Exception as e:
        logger.error(f"Error fetching appointments: {str(e)}")
        return []


@router.post("/appointments")
async def schedule_appointment(
    appt: AppointmentCreate, current_user: TokenPayload = Depends(get_current_patient)
):
    """Schedule a new appointment."""
    data = {
        "patient_id": current_user.sub,
        "doctor_id": appt.doctor_id,
        "scheduled_at": (
            appt.date_time.isoformat()
            if appt.date_time and hasattr(appt.date_time, "isoformat")
            else str(appt.date_time) if appt.date_time else ""
        ),
        "type": appt.type or "video",
        "reason": appt.reason or "Consultation",
        "status": "booked",
    }
    try:
        res = supabase.table("appointments").insert(data).execute()
        if hasattr(res, "__await__"):
            res = await res
        if not res.data:
            raise HTTPException(
                status_code=400, detail="Failed to schedule appointment."
            )

        # Gamification
        asyncio.create_task(
            record_achievement_progress(current_user.sub, "CONSULTATION_READY", 1)
        )

        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Appointment booking error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Booking failed: {str(e)}")


@router.post("/waitlist")
async def join_waitlist(
    appt: dict, current_user: TokenPayload = Depends(get_current_patient)
):
    """Join the waitlist for a doctor."""
    data = {
        "patient_id": current_user.sub,
        "doctor_id": appt.get("doctor_id"),
        "scheduled_at": appt.get("preferred_date"),
        "type": appt.get("type", "video"),
        "reason": appt.get("reason", "Waitlist Request"),
        "status": "waitlist",
    }
    res = supabase.table("appointments").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to join waitlist.")
    return res.data[0]


@router.get("/prescriptions", response_model=List[PrescriptionResponse])
async def get_prescriptions(current_user: TokenPayload = Depends(get_current_patient)):
    """Get all prescriptions for the patient."""
    try:
        # Note: avoid profiles_doctor(*) FK join — relationship may not exist in schema
        res = (
            supabase.table("prescriptions")
            .select("*")
            .eq("patient_id", current_user.sub)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching prescriptions: {e}")
        return []


@router.put("/appointments/{id}/cancel")
async def cancel_appointment(
    id: str, current_user: TokenPayload = Depends(get_current_patient)
):
    """Cancel an appointment."""
    res = (
        supabase.table("appointments")
        .update({"status": "cancelled"})
        .eq("id", id)
        .eq("patient_id", current_user.sub)
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=404, detail="Appointment not found or not authorized."
        )
    return res.data[0]


@router.put("/appointments/{id}/reschedule")
async def reschedule_appointment(
    id: str, payload: dict, current_user: TokenPayload = Depends(get_current_patient)
):
    """Reschedule an existing appointment."""
    new_date = payload.get("scheduled_at") or payload.get("date_time")
    if not new_date:
        raise HTTPException(status_code=400, detail="scheduled_at is required.")
    res = (
        supabase.table("appointments")
        .update({"scheduled_at": new_date, "status": "scheduled"})
        .eq("id", id)
        .eq("patient_id", current_user.sub)
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=404, detail="Appointment not found or not authorized."
        )
    return res.data[0]


@router.get("/history")
async def get_history(current_user: TokenPayload = Depends(get_current_patient)):
    """Fetch and merge scans, appointments, and prescriptions into a unified timeline."""
    try:
        # Get past appointments
        today = datetime.now().isoformat()
        appts_res = (
            supabase.table("appointments")
            .select("id, patient_id, doctor_id, scheduled_at, status, type, reason, notes, created_at")
            .eq("patient_id", current_user.sub)
            .lt("scheduled_at", today)
            .order("scheduled_at", desc=True)
            .execute()
        )
        
        past_appointments = appts_res.data or []
        # Enrich with doctor profiles
        if past_appointments:
            doctor_ids = list(set([a["doctor_id"] for a in past_appointments if a.get("doctor_id")]))
            if doctor_ids:
                docs_res = (
                    supabase.table("profiles_doctor")
                    .select("id, full_name, specialty, avatar_url")
                    .in_("id", doctor_ids)
                    .execute()
                )
                docs_map = {d["id"]: d for d in (docs_res.data or [])}
                for a in past_appointments:
                    doc_id = a.get("doctor_id")
                    if doc_id in docs_map:
                        a["profiles_doctor"] = {
                            "name": docs_map[doc_id].get("full_name"),
                            "specialty": docs_map[doc_id].get("specialty"),
                            "avatar_url": docs_map[doc_id].get("avatar_url")
                        }

        # Get all scans
        scans_res = (
            supabase.table("scans")
            .select("*")
            .eq("patient_id", current_user.sub)
            .order("created_at", desc=True)
            .execute()
        )

        records = []

        # Format Scans
        if scans_res.data:
            for scan in scans_res.data:
                try:
                    # Format to string percentage
                    conf_val = scan.get("confidence") or 0  # Use correct field name
                    if isinstance(conf_val, str):
                        conf_val = float(conf_val)
                    conf_str = f"{int(conf_val * 100)}%"

                    created_at = scan.get("created_at", "")
                    if created_at:
                        date_str = datetime.fromisoformat(
                            created_at.replace("Z", "+00:00")
                        ).strftime("%b %d, %Y")
                    else:
                        date_str = "Unknown Date"

                    # Map prediction to status
                    prediction = scan.get("prediction", "normal")
                    if prediction in ["mild", "moderate", "severe"]:
                        status = "Anemic"
                    else:
                        status = "Normal"

                    records.append(
                        {
                            "id": scan.get("id"),
                            "date": date_str,
                            "raw_date": created_at,
                            "type": "AI Scan",
                            "result": status,  # Use mapped status instead of non-existent 'status' field
                            "details": f"Hemoglobin: {scan.get('hemoglobin_estimate', 'N/A')} g/dL",  # Use correct field name
                            "confidence": conf_str,
                        }
                    )
                except Exception as scan_err:
                    logger.warning(f"Error formatting scan: {scan_err}")

        # Format Appointments
        if appts_res.data:
            try:
                # We also need prescriptions to map to appointments if possible
                rx_res = (
                    supabase.table("prescriptions")
                    .select("*")
                    .eq("patient_id", current_user.sub)
                    .execute()
                )
                rx_dict = (
                    {rx.get("appointment_id"): rx for rx in (rx_res.data or [])}
                    if rx_res.data
                    else {}
                )
            except Exception as rx_err:
                logger.warning(
                    f"Could not fetch prescriptions for history mapping: {rx_err}"
                )
                rx_dict = {}

            for appt in appts_res.data:
                try:
                    # Use scheduled_at (the correct DB column name)
                    date_time = appt.get("scheduled_at", "")
                    if date_time:
                        date_str = datetime.fromisoformat(
                            date_time.replace("Z", "+00:00")
                        ).strftime("%b %d, %Y")
                    else:
                        date_str = "Unknown Date"

                    doctor_info = appt.get("profiles_doctor") or {}

                    appt_id = appt.get("id")
                    prescription_text = ""
                    if appt_id and appt_id in rx_dict:
                        meds = rx_dict[appt_id].get("medications") or []
                        prescription_text = ", ".join(
                            [f"{m.get('name')} {m.get('dosage')}" for m in meds]
                        )

                    records.append(
                        {
                            "id": appt.get("id"),
                            "date": date_str,
                            "raw_date": date_time,
                            "type": (
                                "Video Consultation"
                                if (
                                    appt.get("consultation_type") == "video"
                                    or appt.get("type") == "video"
                                )
                                else "In-Person Consultation"
                            ),
                            "doctor": doctor_info.get("full_name")
                            or doctor_info.get("name", "Unknown Doctor"),
                            "specialty": (doctor_info.get("specialty", "") or "")
                            .replace("_", " ")
                            .title(),
                            "duration": f"{appt.get('duration_minutes') or 30} min",
                            "summary": appt.get("notes")
                            or "Consultation completed successfully.",
                            "prescription": prescription_text,
                        }
                    )
                except Exception as appt_err:
                    logger.warning(f"Error formatting appointment: {appt_err}")

        # Sort combined records by date descending
        records.sort(key=lambda x: x.get("raw_date", ""), reverse=True)

        return {"records": records}
    except Exception as e:
        logger.error(f"History error: {str(e)}")
        return {"records": []}


@router.post("/profile/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: TokenPayload = Depends(get_current_patient),
):
    """Upload profile avatar image to Supabase Storage."""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Validate file size (max 5MB)
        contents = await file.read()  # Read file contents
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=400, detail="File size must be less than 5MB"
            )

        # Generate unique filename
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_filename = f"{current_user.sub}_{uuid.uuid4()}.{file_ext}"

        # Upload to Supabase Storage
        try:
            # Create bucket if it doesn't exist (will fail silently if exists)
            try:
                supabase.storage.create_bucket("avatars", options={"public": True})
            except Exception as e:
                logger.debug(f"Bucket creation skipped (may already exist): {e}")

            # Upload file
            supabase.storage.from_("avatars").upload(
                path=unique_filename,
                file=contents,
                file_options={"content-type": file.content_type},
            )

            # Get public URL
            public_url = supabase.storage.from_("avatars").get_public_url(
                unique_filename
            )

            # Update profile with avatar URL
            update_res = (
                supabase.table("profiles_patient")
                .update({"avatar_url": public_url})
                .eq("id", current_user.sub)
                .execute()
            )

            if not update_res.data:
                raise HTTPException(
                    status_code=500, detail="Failed to update profile with avatar URL"
                )

            return {
                "success": True,
                "avatar_url": public_url,
                "message": "Avatar uploaded successfully",
            }

        except Exception as storage_err:
            logger.error(f"Storage error: {storage_err}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload to storage: {str(storage_err)}",
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Avatar upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/profile")
async def update_profile(
    updates: dict, current_user: TokenPayload = Depends(get_current_patient)
):
    """Update patient profile fields (e.g. language)."""
    try:
        res = (
            supabase.table("profiles_patient")
            .update(updates)
            .eq("id", current_user.sub)
            .execute()
        )
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=400, detail="Failed to update profile.")

        asyncio.create_task(
            record_achievement_progress(current_user.sub, "PROFILE_BUILDER", 1)
        )

        return {"success": True, "data": res.data[0]}
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/medication-schedule")
async def update_medication_schedule(
    schedule: list, current_user: TokenPayload = Depends(get_current_patient)
):
    """Update the AI Nurse outbound medication array."""
    try:
        res = (
            supabase.table("profiles_patient")
            .update({"medication_schedule": schedule})
            .eq("id", current_user.sub)
            .execute()
        )
        return {"message": "Schedule updated", "data": res.data}
    except Exception as e:
        logger.error(f"Med Schedule update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/call-preferences")
async def update_call_preferences(
    prefs: dict, current_user: TokenPayload = Depends(get_current_patient)
):
    """Update the Proactive AI Nurse Call metrics."""
    try:
        res = (
            supabase.table("profiles_patient")
            .update({"call_preferences": prefs})
            .eq("id", current_user.sub)
            .execute()
        )
        return {"message": "Preferences updated", "data": res.data}
    except Exception as e:
        logger.error(f"Call prefs error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# HEALTH RISK ASSESSMENTS
# ============================================


@router.get("/risk-assessments")
async def get_risk_assessments(
    current_user: TokenPayload = Depends(get_current_patient),
):
    """Get all health risk assessments for the patient."""
    try:
        res = (
            supabase.table("risk_assessments")
            .select("*")
            .eq("patient_id", current_user.sub)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching risk assessments: {e}")
        return []


@router.post("/risk-assessments")
async def create_risk_assessment(
    data: dict, current_user: TokenPayload = Depends(get_current_patient)
):
    """Submit a new risk assessment score."""
    try:
        assessment = {
            "patient_id": current_user.sub,
            "assessment_type": data.get("assessment_type", "general"),
            "score": data.get("score", 0),
            "raw_responses": data.get("raw_responses", {}),
        }
        res = supabase.table("risk_assessments").insert(assessment).execute()

        if not res.data:
            raise HTTPException(
                status_code=400, detail="Failed to save risk assessment."
            )

        return res.data[0]
    except Exception as e:
        logger.error(f"Error creating risk assessment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risk-assessments/{id}")
async def get_risk_assessment(
    id: str, current_user: TokenPayload = Depends(get_current_patient)
):
    """Retrieve full details of a specific assessment."""
    try:
        res = (
            supabase.table("risk_assessments")
            .select("*")
            .eq("id", id)
            .eq("patient_id", current_user.sub)
            .single()
            .execute()
        )
        return res.data
    except Exception as e:
        logger.error(f"Error fetching assessment {id}: {e}")
        raise HTTPException(status_code=404, detail="Risk Assessment not found")


# ============================================
# FAMILY HEALTH MANAGEMENT
# ============================================


@router.get("/family-members")
async def get_family_members(current_user: TokenPayload = Depends(get_current_patient)):
    """Get all family members (dependents) under this patient account."""
    try:
        # Query the family_members table (not profiles_patient)
        res = (
            supabase.table("family_members")
            .select("*")
            .eq("primary_user_id", current_user.sub)
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching family members: {e}")
        return []


@router.post("/family-members")
async def add_family_member(
    data: dict, current_user: TokenPayload = Depends(get_current_patient)
):
    """Add a new family member (dependent) under the current patient's account.

    Note: Uses a dedicated family_members table to avoid FK constraints on profiles_patient.
    Falls back to profiles_patient insert if family_members table doesn't exist yet.
    """
    member_data = {
        "id": str(uuid.uuid4()),
        "primary_user_id": current_user.sub,  # Changed from primary_patient_id to match schema
        "name": data.get("full_name") or data.get("name"),  # Support both field names
        "relation": data.get("relationship")
        or data.get("relation", "family"),  # Changed to match schema
        "date_of_birth": data.get("date_of_birth"),
        "age": data.get("age"),
        "gender": data.get("gender"),
        "blood_group": data.get("blood_group"),
        "phone": data.get("phone"),
        "email": data.get("email"),
        "medical_conditions": data.get("medical_conditions", []),
        "allergies": data.get("allergies", []),
    }
    try:
        # Try dedicated family_members table first (no FK constraint to auth.users)
        res = supabase.table("family_members").insert(member_data).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=400, detail="Failed to add family member.")
        return {"success": True, "data": res.data[0]}
    except Exception as family_table_err:
        err_str = str(family_table_err)
        if "does not exist" in err_str or "42P01" in err_str:
            # family_members table not yet created — return guidance
            logger.warning(
                "family_members table not found. Please create it in Supabase."
            )
            raise HTTPException(
                status_code=501,
                detail="Family members table not set up. Please run the DB migration to create the family_members table.",
            )
        logger.error(f"Error creating family member: {family_table_err}")
        raise HTTPException(status_code=500, detail=str(family_table_err))


# ============================================
# MEDICATION REMINDERS
# ============================================


@router.get("/medications")
async def get_medications(current_user: TokenPayload = Depends(get_current_patient)):
    """Get active medication reminders for patient."""
    try:
        res = (
            supabase.table("medications")
            .select("*")
            .eq("patient_id", current_user.sub)
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching medications: {e}")
        return []


@router.post("/medications")
async def add_medication(
    data: dict, current_user: TokenPayload = Depends(get_current_patient)
):
    """Add a new medication reminder."""
    try:
        med = {
            "patient_id": current_user.sub,
            "name": data.get("name"),
            "dosage": data.get("dosage"),
            "frequency": data.get("frequency"),
            "time_slots": data.get("time_slots", []),
            "start_date": data.get("start_date"),
            "end_date": data.get("end_date"),
            "is_active": True,
        }
        res = supabase.table("medications").insert(med).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        logger.error(f"Error adding medication: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/medications/{id}/toggle")
async def toggle_medication(
    id: str, data: dict, current_user: TokenPayload = Depends(get_current_patient)
):
    """Turn a reminder on or off."""
    try:
        res = (
            supabase.table("medications")
            .update({"is_active": data.get("is_active", False)})
            .eq("id", id)
            .eq("patient_id", current_user.sub)
            .execute()
        )
        return res.data[0] if res.data else {}
    except Exception as e:
        logger.error(f"Error toggling med: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/medications/{id}")
async def delete_medication(
    id: str, current_user: TokenPayload = Depends(get_current_patient)
):
    """Delete a medication reminder."""
    try:
        supabase.table("medications").delete().eq("id", id).eq(
            "patient_id", current_user.sub
        ).execute()
        return {"success": True}
    except Exception as e:
        logger.error(f"Error deleting med: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# CHRONIC DISEASE MANAGEMENT
# ============================================


@router.get("/vitals")
async def get_vitals(current_user: TokenPayload = Depends(get_current_patient)):
    """Get all vitals tracking logs for the patient."""
    try:
        res = (
            supabase.table("vitals_log")
            .select("*")
            .eq("patient_id", current_user.sub)
            .order("logged_at", desc=True)
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching vitals: {e}")
        return []


@router.post("/vitals")
async def add_vital_log(
    data: dict, current_user: TokenPayload = Depends(get_current_patient)
):
    """Add a new vital tracking log."""
    try:
        vital = {
            "patient_id": current_user.sub,
            "tracker_type": data.get("tracker_type"),
            "value": data.get("value"),
            "unit": data.get("unit"),
            "notes": data.get("notes", ""),
        }
        res = supabase.table("vitals_log").insert(vital).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        logger.error(f"Error logging vital: {e}")
        raise HTTPException(status_code=500, detail="Failed to log vital")


# ============================================
# PATIENT FOLLOW-UP & RATINGS
# ============================================


@router.get("/follow-ups/{appointment_id}")
async def get_follow_up(
    appointment_id: str, current_user: TokenPayload = Depends(get_current_patient)
):
    """Check if a follow-up exists for a given appointment."""
    try:
        res = (
            supabase.table(Tables.FOLLOW_UP_SURVEYS)
            .select("*")
            .eq(Col.FollowUpSurveys.APPOINTMENT_ID, appointment_id)
            .eq(Col.FollowUpSurveys.PATIENT_ID, current_user.sub)
            .execute()
        )
        return res.data[0] if res.data else None
    except Exception as e:
        logger.error(f"Error checking follow-up: {e}")
        return None


@router.post("/follow-ups")
async def submit_follow_up(
    data: dict, current_user: TokenPayload = Depends(get_current_patient)
):
    """Submit a rating and review for an appointment."""
    try:
        appt_id = data.get("appointment_id")
        rating = data.get("rating")
        review = data.get("review", "")

        # Verify appointment belongs to patient
        appt = (
            supabase.table("appointments")
            .select("doctor_id")
            .eq("id", appt_id)
            .eq("patient_id", current_user.sub)
            .execute()
        )
        if not appt.data:
            raise HTTPException(status_code=403, detail="Unauthorized")

        doctor_id = appt.data[0]["doctor_id"]

        survey = {
            Col.FollowUpSurveys.APPOINTMENT_ID: appt_id,
            Col.FollowUpSurveys.PATIENT_ID: current_user.sub,
            Col.FollowUpSurveys.DOCTOR_ID: doctor_id,
            Col.FollowUpSurveys.RATING: rating,  # integer 1-5
            Col.FollowUpSurveys.RESPONSE: review,  # text feedback
            Col.FollowUpSurveys.ANSWERED_AT: datetime.now().isoformat(),
        }
        res = supabase.table(Tables.FOLLOW_UP_SURVEYS).insert(survey).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        logger.error(f"Error saving follow up: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# PRO: PATIENT REPORTED OUTCOMES
# ============================================


@router.get("/pro-questionnaires")
async def get_patient_pro_questionnaires(
    current_user: TokenPayload = Depends(get_current_patient),
):
    """Get active PRO questionnaires from doctors this patient has seen."""
    try:
        # 1. Find doctors associated with this patient
        appts = (
            supabase.table("appointments")
            .select("doctor_id")
            .eq("patient_id", current_user.sub)
            .execute()
        )
        doctor_ids = list(
            set([a["doctor_id"] for a in (appts.data or []) if a.get("doctor_id")])
        )

        if not doctor_ids:
            return []

        # 2. Fetch active questionnaires for these doctors
        res = (
            supabase.table("pro_questionnaires")
            .select("*")
            .in_("doctor_id", doctor_ids)
            .eq("is_active", True)
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching PRO questionnaires: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pro-submissions")
async def submit_pro_questionnaire(
    data: dict, current_user: TokenPayload = Depends(get_current_patient)
):
    """Submit answers to a PRO questionnaire."""
    try:
        submission = {
            "patient_id": current_user.sub,
            "questionnaire_id": data.get("questionnaire_id"),
            "answers": data.get("answers", {}),
        }
        res = supabase.table("pro_submissions").insert(submission).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        logger.error(f"Error submitting PRO data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pro-submissions")
async def get_patient_pro_submissions(
    current_user: TokenPayload = Depends(get_current_patient),
):
    """Get PRO submission history for the current patient."""
    try:
        res = (
            supabase.table("pro_submissions")
            .select("*")
            .eq("patient_id", current_user.sub)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching PRO submissions: {e}")
        # Non-critical: allow UI to render with empty history
        return []


@router.post("/sos")
async def trigger_emergency_sos(
    data: dict, current_user: TokenPayload = Depends(get_current_patient)
):
    """Trigger an Emergency SOS alert."""
    try:
        lat = data.get("lat")
        lng = data.get("lng")

        # Get patient name
        profile_res = (
            supabase.table("profiles_patient")
            .select("full_name")
            .eq("id", current_user.sub)
            .single()
            .execute()
        )
        patient_name = (
            profile_res.data.get("full_name", "A Patient")
            if profile_res.data
            else "A Patient"
        )

        maps_link = (
            f"https://www.google.com/maps?q={lat},{lng}"
            if lat and lng
            else "Unknown Location"
        )

        sms_body = f"EMERGENCY SOS: {patient_name} requires immediate medical assistance. Last Location: {maps_link}"

        # Send SMS via Twilio
        try:
            if (
                settings.TWILIO_ACCOUNT_SID
                and not settings.TWILIO_ACCOUNT_SID.startswith("AC_mock")
            ):
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                # SOS_EMERGENCY_PHONE is configurable via .env (default +919999999999)
                # In production, query the patient's emergency contacts instead
                to_phone = settings.SOS_EMERGENCY_PHONE
                client.messages.create(
                    body=sms_body, from_=settings.TWILIO_PHONE_NUMBER, to=to_phone
                )
        except Exception as twilio_err:
            logger.error(f"Failed to send SOS SMS: {twilio_err}")

        # Log to notifications — only real columns: user_id, type, title, message
        supabase.table(Tables.NOTIFICATIONS).insert(
            {
                Col.Notifications.USER_ID: current_user.sub,
                Col.Notifications.TYPE: "emergency_sos",
                Col.Notifications.TITLE: "SOS Triggered",
                Col.Notifications.MESSAGE: f"Broadcast sent with location: {maps_link}",
            }
        ).execute()

        return {"success": True, "message": "SOS Alert Dispatched"}
    except Exception as e:
        logger.error(f"SOS Trigger Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/fhir")
async def export_fhir(current_user: TokenPayload = Depends(get_current_patient)):
    """
        Export patient health record as a FHIR R4 Bundle JSON.
        Includes Patient,
    Appointment (Encounter)
    import Prescription (MedicationRequest)
    and Vital Signs (Observation) resources.
    """

    patient_id = current_user.sub

    try:
        # Fetch all necessary patient data in parallel
        profile_res = (
            supabase.table("profiles_patient")
            .select("*")
            .eq("id", patient_id)
            .maybe_single()
            .execute()
        )
        appts_res = (
            supabase.table("appointments")
            .select("*")
            .eq("patient_id", patient_id)
            .execute()
        )
        rx_res = (
            supabase.table("prescriptions")
            .select("*")
            .eq("patient_id", patient_id)
            .execute()
        )
        vitals_res = (
            supabase.table("vitals_log")
            .select("*")
            .eq("patient_id", patient_id)
            .execute()
        )

        profile = profile_res.data or {}

        bundle: dict = {
            "resourceType": "Bundle",
            "type": "collection",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "entry": [],
        }

        # ── Patient Resource ────────────────────────────────────
        bundle["entry"].append(
            {
                "resource": {
                    "resourceType": "Patient",
                    "id": patient_id,
                    "name": [{"text": profile.get("full_name", "Unknown")}],
                    "birthDate": profile.get("date_of_birth"),
                    "gender": profile.get("gender", "unknown"),
                    "telecom": [{"system": "email", "value": profile.get("email")}],
                }
            }
        )

        # ── Appointment → Encounter Resources ───────────────────
        for appt in appts_res.data or []:
            bundle["entry"].append(
                {
                    "resource": {
                        "resourceType": "Encounter",
                        "id": appt.get("id"),
                        "status": appt.get("status", "unknown"),
                        "class": {"code": "VR", "display": "virtual"},
                        "subject": {"reference": f"Patient/{patient_id}"},
                        "period": {"start": appt.get("scheduled_at")},
                    }
                }
            )

        # ── Prescription → MedicationRequest Resources ──────────
        for rx in rx_res.data or []:
            meds = (
                rx.get("medications", [])
                if isinstance(rx.get("medications"), list)
                else []
            )
            for med in meds:
                bundle["entry"].append(
                    {
                        "resource": {
                            "resourceType": "MedicationRequest",
                            "id": f"{rx.get('id')}-{med.get('name', 'med')}",
                            "status": "active",
                            "intent": "order",
                            "medicationCodeableConcept": {
                                "text": med.get("name", "Unknown medication")
                            },
                            "subject": {"reference": f"Patient/{patient_id}"},
                            "dosageInstruction": [
                                {
                                    "text": f"{med.get('dosage')} - {med.get('frequency')}"
                                }
                            ],
                        }
                    }
                )

        # ── Vitals → Observation Resources ──────────────────────
        for vital in vitals_res.data or []:
            bundle["entry"].append(
                {
                    "resource": {
                        "resourceType": "Observation",
                        "id": vital.get("id"),
                        "status": "final",
                        "code": {"text": vital.get("tracker_type", "Vital Sign")},
                        "subject": {"reference": f"Patient/{patient_id}"},
                        "effectiveDateTime": vital.get("logged_at"),
                        "valueQuantity": {
                            "value": vital.get("value"),
                            "unit": vital.get("unit", ""),
                        },
                    }
                }
            )

        return JSONResponse(
            content=bundle,
            headers={
                "Content-Disposition": "attachment; filename=health_record_fhir.json"
            },
        )

    except Exception as e:
        logger.error(f"FHIR export error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate FHIR export")


# ─── Language Preference ─────────────────────────────────────────────────────
# profiles_patient column is "language" — NOT "preferred_language"


class LanguagePreferencePayload(BaseModel):
    language: str


@router.put("/profile/language")
async def update_language_preference(
    payload: LanguagePreferencePayload,
    current_user: TokenPayload = Depends(get_current_patient),
):
    """Update the user's preferred language. Column name is 'language' in profiles_patient."""
    valid_langs = {"en", "hi", "ta", "te", "mr"}
    if payload.language not in valid_langs:
        raise HTTPException(
            status_code=400, detail=f"Invalid language. Supported: {valid_langs}"
        )
    try:
        supabase.table(Tables.PROFILES_PATIENT).update(
            {Col.ProfilesPatient.LANGUAGE: payload.language}
        ).eq(Col.ProfilesPatient.ID, current_user.sub).execute()
        return {"message": "Language preference updated", "language": payload.language}
    except Exception as e:
        logger.error(f"update_language_preference error: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to update language preference"
        )
