import logging
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timedelta

from app.core.security import get_current_admin
from app.models.schemas import TokenPayload
from app.services.supabase import supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_dashboard_metrics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: TokenPayload = Depends(get_current_admin),
):
    """Get high-level platform metrics for the admin dashboard with date range support."""
    try:
        # Default to last 30 days if no dates provided
        if not end_date:
            end_date = datetime.now().isoformat()
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).isoformat()

        # User Counts
        patients_res = (
            supabase.table("profiles_patient")
            .select("id, created_at", count="exact")
            .execute()
        )
        doctors_res = (
            supabase.table("profiles_doctor")
            .select("id, created_at", count="exact")
            .execute()
        )

        # Filter by date range
        new_patients = len(
            [
                p
                for p in (patients_res.data or [])
                if p.get("created_at", "") >= start_date
            ]
        )
        new_doctors = len(
            [
                d
                for d in (doctors_res.data or [])
                if d.get("created_at", "") >= start_date
            ]
        )

        # Appointment Stats
        appts_res = (
            supabase.table("appointments")
            .select("id, status, scheduled_at, created_at")
            .gte("created_at", start_date)
            .lte("created_at", end_date)
            .execute()
        )
        appts = appts_res.data or []
        completed_appts = len([a for a in appts if a.get("status") == "completed"])
        cancelled_appts = len([a for a in appts if a.get("status") == "cancelled"])
        pending_appts = len([a for a in appts if a.get("status") == "pending"])

        # Scan Stats
        scans_res = (
            supabase.table("scans")
            .select("id, created_at, prediction, severity")
            .gte("created_at", start_date)
            .lte("created_at", end_date)
            .execute()
        )
        scans = scans_res.data or []

        # Revenue Estimate (mock logic based on completed appts * average fee)
        revenue = completed_appts * 100

        # Calculate growth rates (compare to previous period)
        prev_start = (
            datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            - timedelta(days=30)
        ).isoformat()
        prev_appts = (
            supabase.table("appointments")
            .select("id, status")
            .gte("created_at", prev_start)
            .lt("created_at", start_date)
            .execute()
        )
        prev_completed = len(
            [a for a in (prev_appts.data or []) if a.get("status") == "completed"]
        )

        growth_rate = 0.0
        if prev_completed > 0:
            growth_rate = ((completed_appts - prev_completed) / prev_completed) * 100

        return {
            "total_patients": patients_res.count or 0,
            "total_doctors": doctors_res.count or 0,
            "new_patients": new_patients,
            "new_doctors": new_doctors,
            "total_appointments": len(appts),
            "completed_appointments": completed_appts,
            "cancelled_appointments": cancelled_appts,
            "pending_appointments": pending_appts,
            "total_scans": len(scans),
            "estimated_revenue": revenue,
            "growth_rate": round(growth_rate, 2),
            "active_users_30d": (patients_res.count or 0) + (doctors_res.count or 0),
            "date_range": {"start": start_date, "end": end_date},
        }
    except Exception as e:
        logger.error(f"Analytics metrics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends/appointments")
async def get_appointment_trends(
    days: int = 30, current_user: TokenPayload = Depends(get_current_admin)
):
    """Get appointment volume trends over time."""
    try:
        start_date = (datetime.now() - timedelta(days=days)).isoformat()
        res = (
            supabase.table("appointments")
            .select("scheduled_at, status")
            .gte("scheduled_at", start_date)
            .execute()
        )

        # Group by date
        trends = {}
        for a in res.data or []:
            scheduled_at = a.get("scheduled_at")
            if not scheduled_at:
                continue
            date_str = scheduled_at.split("T")[0]
            if date_str not in trends:
                trends[date_str] = {
                    "date": date_str,
                    "total": 0,
                    "completed": 0,
                    "cancelled": 0,
                }

            trends[date_str]["total"] += 1
            if a.get("status") == "completed":
                trends[date_str]["completed"] += 1
            elif a.get("status") == "cancelled":
                trends[date_str]["cancelled"] += 1

        # Sort and return as list
        sorted_trends = sorted(list(trends.values()), key=lambda x: x["date"])
        return {"data": sorted_trends}
    except Exception as e:
        logger.error(f"Analytics appointment trends error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends/scans")
async def get_scan_trends(
    days: int = 30, current_user: TokenPayload = Depends(get_current_admin)
):
    """Get AI scan volume trends over time."""
    try:
        start_date = (datetime.now() - timedelta(days=days)).isoformat()
        res = (
            supabase.table("scans")
            .select("created_at, prediction, severity")
            .gte("created_at", start_date)
            .execute()
        )

        # Group by date
        trends = {}
        for a in res.data or []:
            created_at = a.get("created_at")
            if not created_at:
                continue
            date_str = created_at.split("T")[0]
            if date_str not in trends:
                trends[date_str] = {
                    "date": date_str,
                    "total": 0,
                    "anemic": 0,
                    "normal": 0,
                }

            trends[date_str]["total"] += 1

        sorted_trends = sorted(list(trends.values()), key=lambda x: x["date"])
        return {"data": sorted_trends}
    except Exception as e:
        logger.error(f"Analytics scan trends error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/performance/doctors")
async def get_doctor_performance(
    limit: int = 10, current_user: TokenPayload = Depends(get_current_admin)
):
    """Get top performing doctors."""
    try:
        # In a real app, this would be a complex join or a view
        res = (
            supabase.table("profiles_doctor")
            .select("id, full_name, specialty, rating, experience_years")
            .order("rating", desc=True)
            .limit(limit)
            .execute()
        )

        # Fetch appointment counts for these doctors
        doctor_ids = [d["id"] for d in (res.data or [])]
        if not doctor_ids:
            return {"data": []}

        # Supabase Python client 'in_' expects a list
        appts_res = (
            supabase.table("appointments")
            .select("doctor_id, status")
            .in_("doctor_id", doctor_ids)
            .execute()
        )

        appt_counts = {}
        for a in appts_res.data or []:
            d_id = a.get("doctor_id")
            if d_id not in appt_counts:
                appt_counts[d_id] = {"total": 0, "completed": 0}
            appt_counts[d_id]["total"] += 1
            if a.get("status") == "completed":
                appt_counts[d_id]["completed"] += 1

        doctors = []
        for d in res.data or []:
            counts = appt_counts.get(d["id"], {"total": 0, "completed": 0})
            specialty = d.get("specialty") or "General"
            doctors.append(
                {
                    "id": d["id"],
                    "name": d.get("full_name", "Unknown"),
                    "specialty": specialty.replace("_", " ").title(),
                    "rating": d.get("rating", 0),
                    "total_appointments": counts["total"],
                    "completed_appointments": counts["completed"],
                }
            )

        return {"data": doctors}
    except Exception as e:
        logger.error(f"Analytics doctor performance error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
