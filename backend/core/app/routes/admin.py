import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from typing import Optional, Dict, Any

from app.core.security import get_current_admin
from app.models.schemas import TokenPayload, UserRole
from app.services.supabase import supabase

router = APIRouter(prefix="/admin", tags=["Admin"])
public_router = APIRouter(prefix="/team", tags=["Team (Public)"])


@router.get("/settings")
async def get_admin_settings(current_user: TokenPayload = Depends(get_current_admin)):
    """Fetch platform settings for the admin portal."""
    from app.routes.settings import get_platform_settings

    return await get_platform_settings()


@router.put("/settings")
@router.post("/settings")
async def update_admin_settings(
    settings: Dict[str, Any] = Body(...),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """Update platform settings from the admin portal."""
    from app.routes.settings import update_platform_settings

    return await update_platform_settings(settings, current_user)


@router.get("/stats")
async def get_platform_stats(current_user: TokenPayload = Depends(get_current_admin)):
    """Platform wide statistics overview."""
    try:
        pat_res = (
            supabase.table("profiles_patient").select("id", count="exact").execute()
        )
        doc_res = (
            supabase.table("profiles_doctor").select("id", count="exact").execute()
        )
        appt_res = supabase.table("appointments").select("id", count="exact").execute()
        scan_res = supabase.table("scans").select("id", count="exact").execute()

        # Mock data for demonstration purposes in charts
        growth_data = [
            {"name": "Jan", "users": 10, "scans": 5},
            {"name": "Feb", "users": 20, "scans": 15},
            {"name": "Mar", "users": 35, "scans": 25},
            {"name": "Apr", "users": 40, "scans": 30},
            {
                "name": "May",
                "users": pat_res.count + doc_res.count,
                "scans": scan_res.count,
            },
        ]

        appointments_weekly = [
            {"name": "Mon", "count": 2},
            {"name": "Tue", "count": 1},
            {"name": "Wed", "count": 5},
            {"name": "Thu", "count": 0},
            {"name": "Fri", "count": 3},
            {"name": "Sat", "count": appt_res.count},
            {"name": "Sun", "count": 1},
        ]

        return {
            "total_patients": pat_res.count,
            "total_doctors": doc_res.count,
            "total_appointments": appt_res.count,
            "total_scans": scan_res.count,
            "growth_data": growth_data,
            "appointments_weekly": appointments_weekly,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/doctors/pending")
async def get_pending_doctors(current_user: TokenPayload = Depends(get_current_admin)):
    """List unverified doctors requiring admin approval."""
    res = (
        supabase.table("profiles_doctor").select("*").eq("is_verified", False).execute()
    )
    return res.data


@router.put("/doctors/{id}/verify")
async def verify_doctor(
    id: str, payload: dict, current_user: TokenPayload = Depends(get_current_admin)
):
    """Approve or revoke a doctor's profile verification."""
    verified = payload.get("verified", True)
    res = (
        supabase.table("profiles_doctor")
        .update({"is_verified": verified})
        .eq("id", id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    return res.data[0]


@router.put("/users/{id}/role")
async def update_user_role(
    id: str, role: UserRole, current_user: TokenPayload = Depends(get_current_admin)
):
    """
    Update a user's role.
    Note: Supabase Auth metadata updates are strictly admin-only.
    """
    try:
        # We use supabase.auth.admin to update user metadata
        supabase.auth.admin.update_user_by_id(
            id, {"user_metadata": {"role": role.value}}
        )
        return {"message": f"Role updated to {role.value} successfully.", "user_id": id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/patients")
async def get_all_patients(current_user: TokenPayload = Depends(get_current_admin)):
    """List all patient profiles."""
    res = supabase.table("profiles_patient").select("*").execute()
    return res.data


@router.get("/patients/{id}")
async def get_patient_detail(
    id: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """Get detailed information about a specific patient."""
    try:
        # Get patient profile
        patient_res = (
            supabase.table("profiles_patient")
            .select("*")
            .eq("id", id)
            .single()
            .execute()
        )
        if not patient_res.data:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Get patient's appointments
        appts_res = (
            supabase.table("appointments").select("*").eq("patient_id", id).execute()
        )

        # Get patient's scans
        scans_res = supabase.table("scans").select("*").eq("patient_id", id).execute()

        return {
            "profile": patient_res.data,
            "appointments": appts_res.data,
            "scans": scans_res.data,
            "total_appointments": len(appts_res.data),
            "total_scans": len(scans_res.data),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/doctors")
async def get_all_doctors(current_user: TokenPayload = Depends(get_current_admin)):
    """List all doctor profiles."""
    res = supabase.table("profiles_doctor").select("*").execute()
    return res.data


@router.get("/doctors/{id}")
async def get_doctor_detail(
    id: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """Get detailed information about a specific doctor."""
    try:
        # Get doctor profile
        doctor_res = (
            supabase.table("profiles_doctor")
            .select("*")
            .eq("id", id)
            .single()
            .execute()
        )
        if not doctor_res.data:
            raise HTTPException(status_code=404, detail="Doctor not found")

        # Get doctor's appointments
        appts_res = (
            supabase.table("appointments").select("*").eq("doctor_id", id).execute()
        )

        # Get doctor's ratings
        ratings_res = (
            supabase.table("ratings").select("*").eq("doctor_id", id).execute()
        )

        return {
            "profile": doctor_res.data,
            "appointments": appts_res.data,
            "ratings": ratings_res.data,
            "total_appointments": len(appts_res.data),
            "average_rating": (
                sum(r.get("rating", 0) for r in ratings_res.data)
                / len(ratings_res.data)
                if ratings_res.data
                else 0
            ),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/appointments")
async def get_all_appointments(current_user: TokenPayload = Depends(get_current_admin)):
    """List all appointments with patient and doctor info."""
    res = (
        supabase.table("appointments")
        .select(
            "id, patient_id, doctor_id, scheduled_at, status, type, reason, created_at, updated_at"
        )
        .execute()
    )
    return res.data


@router.get("/waitlist")
async def get_waitlisted_appointments(
    current_user: TokenPayload = Depends(get_current_admin),
):
    """List all waitlisted appointments."""
    res = (
        supabase.table("appointments")
        .select("*")
        .eq("status", "waitlist")
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


@router.get("/appointments/{id}")
async def get_appointment_detail(
    id: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """Get detailed information about a specific appointment."""
    try:
        # Get appointment
        appt_res = (
            supabase.table("appointments").select("*").eq("id", id).single().execute()
        )
        if not appt_res.data:
            raise HTTPException(status_code=404, detail="Appointment not found")

        # Get patient info
        patient_res = (
            supabase.table("profiles_patient")
            .select("*")
            .eq("id", appt_res.data["patient_id"])
            .single()
            .execute()
        )

        # Get doctor info
        doctor_res = (
            supabase.table("profiles_doctor")
            .select("*")
            .eq("id", appt_res.data["doctor_id"])
            .single()
            .execute()
        )

        return {
            "appointment": appt_res.data,
            "patient": patient_res.data if patient_res.data else None,
            "doctor": doctor_res.data if doctor_res.data else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scans")
async def get_all_scans(current_user: TokenPayload = Depends(get_current_admin)):
    """List all AI scans performed on the platform."""
    res = supabase.table("scans").select("*").execute()
    return res.data


@router.get("/scans/{id}")
async def get_scan_detail(
    id: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """Get detailed information about a specific scan."""
    try:
        scan_res = supabase.table("scans").select("*").eq("id", id).single().execute()
        if not scan_res.data:
            raise HTTPException(status_code=404, detail="Scan not found")
        patient_res = (
            supabase.table("profiles_patient")
            .select("*")
            .eq("id", scan_res.data["patient_id"])
            .single()
            .execute()
        )
        return {
            "scan": scan_res.data,
            "patient": patient_res.data if patient_res.data else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users")
async def get_all_users(current_user: TokenPayload = Depends(get_current_admin)):
    """
    Combined list of all platform users (patients + doctors).
    Used by the messages page "New Message" dialog for admin contacts.
    """
    try:
        patients_res = (
            supabase.table("profiles_patient")
            .select("id, full_name, avatar_url, email")
            .execute()
        )
        doctors_res = (
            supabase.table("profiles_doctor")
            .select("id, full_name, avatar_url, specialty")
            .execute()
        )

        patients = [{**p, "role": "patient"} for p in (patients_res.data or [])]
        doctors = [{**d, "role": "doctor"} for d in (doctors_res.data or [])]

        return patients + doctors
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reviews")
async def get_all_reviews(current_user: TokenPayload = Depends(get_current_admin)):
    """Get all ratings and reviews from patients."""
    try:
        # Get all reviews from follow_up_surveys (this is where patient reviews are actually saved)
        surveys_res = (
            supabase.table("follow_up_surveys")
            .select("*")
            .order("answered_at", desc=True)
            .execute()
        )

        if not surveys_res.data:
            return []

        # Enrich with patient and doctor names
        enriched_ratings = []
        for survey in surveys_res.data:
            # Get patient info
            patient_res = (
                supabase.table("profiles_patient")
                .select("id, full_name, email")
                .eq("id", survey["patient_id"])
                .execute()
            )

            # Get doctor info
            doctor_res = (
                supabase.table("profiles_doctor")
                .select("id, full_name, specialty")
                .eq("id", survey["doctor_id"])
                .execute()
            )

            # Get appointment info
            appointment_res = None
            if survey.get("appointment_id"):
                appointment_res = (
                    supabase.table("appointments")
                    .select("id, scheduled_at, type, status")
                    .eq("id", survey["appointment_id"])
                    .execute()
                )

            # Map follow_up_surveys fields to match frontend expectations
            enriched_rating = {
                "id": survey.get("id"),
                "patient_id": survey.get("patient_id"),
                "doctor_id": survey.get("doctor_id"),
                "appointment_id": survey.get("appointment_id"),
                "rating": survey.get(
                    "response", 0
                ),  # follow_up_surveys uses 'response' field
                "review": survey.get("review", ""),
                "created_at": survey.get(
                    "answered_at"
                ),  # follow_up_surveys uses 'answered_at'
                "patient_name": (
                    patient_res.data[0].get("full_name")
                    if patient_res.data
                    else "Unknown Patient"
                ),
                "patient_email": (
                    patient_res.data[0].get("email") if patient_res.data else None
                ),
                "doctor_name": (
                    doctor_res.data[0].get("full_name")
                    if doctor_res.data
                    else "Unknown Doctor"
                ),
                "doctor_specialty": (
                    doctor_res.data[0].get("specialty") if doctor_res.data else None
                ),
                "appointment": (
                    appointment_res.data[0]
                    if appointment_res and appointment_res.data
                    else None
                ),
            }
            enriched_ratings.append(enriched_rating)

        return enriched_ratings
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch reviews: {str(e)}"
        )


@router.delete("/reviews/{id}")
async def delete_review(
    id: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """Delete a review (admin only)."""
    try:
        # Delete from follow_up_surveys table (where reviews are actually stored)
        result = supabase.table("follow_up_surveys").delete().eq("id", id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Review not found")
        return {"success": True, "message": "Review deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete review: {str(e)}"
        )


@public_router.get("")
async def get_team_members_public():
    """Publicly accessible endpoint to list all active team members."""
    try:
        res = (
            supabase.table("team_members")
            .select("*")
            .eq("is_active", True)
            .order("created_at", desc=False)
            .execute()
        )
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/team")
async def get_team_members(current_user: TokenPayload = Depends(get_current_admin)):
    """List all team members (admin only)."""
    try:
        res = (
            supabase.table("team_members")
            .select("*")
            .order("created_at", desc=False)
            .execute()
        )
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/team")
async def create_team_member(
    name: str = Form(...),
    role: str = Form(...),
    bio: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    is_active: bool = Form(True),
    avatar: Optional[UploadFile] = File(None),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """Create a new team member with optional avatar upload."""
    try:
        avatar_url = None
        if avatar:
            contents = await avatar.read()
            file_ext = (
                avatar.filename.split(".")[-1] if "." in avatar.filename else "jpg"
            )
            unique_name = f"team/{uuid.uuid4()}.{file_ext}"
            try:
                supabase.storage.create_bucket("avatars", options={"public": True})
            except Exception:
                pass  # Bucket may already exist
            supabase.storage.from_("avatars").upload(
                path=unique_name,
                file=contents,
                file_options={"content-type": avatar.content_type},
            )
            avatar_url = supabase.storage.from_("avatars").get_public_url(unique_name)

        data = {
            "name": name,
            "role": role,
            "bio": bio,
            "linkedin_url": linkedin_url,
            "is_active": is_active,
            "avatar_url": avatar_url,
        }
        res = supabase.table("team_members").insert(data).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/team/{id}")
async def update_team_member(
    id: str,
    name: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    is_active: Optional[bool] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    current_user: TokenPayload = Depends(get_current_admin),
):
    """Update a team member."""
    try:
        update_data = {}
        if name is not None:
            update_data["name"] = name
        if role is not None:
            update_data["role"] = role
        if bio is not None:
            update_data["bio"] = bio
        if linkedin_url is not None:
            update_data["linkedin_url"] = linkedin_url
        if is_active is not None:
            update_data["is_active"] = str(is_active)

        if avatar:
            contents = await avatar.read()
            file_ext = (
                avatar.filename.split(".")[-1] if "." in avatar.filename else "jpg"
            )
            unique_name = f"team/{id}_{uuid.uuid4()}.{file_ext}"
            try:
                supabase.storage.create_bucket("avatars", options={"public": True})
            except Exception:
                pass  # Bucket may already exist
            supabase.storage.from_("avatars").upload(
                path=unique_name,
                file=contents,
                file_options={"content-type": avatar.content_type},
            )
            update_data["avatar_url"] = (
                supabase.storage.from_("avatars")
                .get_public_url(unique_name)
                .split("?")[0]
            )

        res = supabase.table("team_members").update(update_data).eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Team member not found")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/team/{id}")
async def delete_team_member(
    id: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """Delete a team member."""
    try:
        res = supabase.table("team_members").delete().eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Team member not found")
        return {"success": True, "message": "Team member deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
