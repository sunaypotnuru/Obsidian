from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel
from app.core.security import get_current_user
from app.models.schemas import TokenPayload, VideoTokenResponse
from app.services.livekit import (
    create_room_token,
    receive_webhook,
    start_room_recording,
    stop_room_recording,
)
from app.services.supabase import supabase
from app.core.config import settings

router = APIRouter(prefix="/video", tags=["Video"])


@router.get("/token", response_model=VideoTokenResponse)
async def get_video_token(
    room: str, identity: str, current_user: TokenPayload = Depends(get_current_user)
):
    """
    Generate a LiveKit JWT token for connecting to a video consultation room.
    """
    # Verify the appointment exists
    appt_res = (
        supabase.table("appointments").select("id").eq("livekit_room", room).execute()
    )
    if not appt_res.data:
        # Creating ad-hoc or failing. We'll allow ad-hoc for demo flexibility
        pass

    token = create_room_token(room, identity)
    return {"token": token, "serverUrl": settings.LIVEKIT_URL or "ws://localhost:7880"}


@router.post("/webhook")
async def livekit_webhook(request: Request, authorization: str = Header(None)):
    """
    Handle LiveKit Webhooks (room started, participant joined, room finished).
    """
    body = await request.body()
    body_str = body.decode("utf-8")

    event = receive_webhook(body_str, authorization)
    if not event:
        raise HTTPException(status_code=400, detail="Invalid webhook representation")

    event_type = getattr(event, "event", None)
    room = getattr(event, "room", None)

    if event_type == "room_finished" and room:
        # Update appointment status to completed and log duration
        room_name = room.name
        duration = room.empty_timeout  # Approx metric, or compute from timestamps

        supabase.table("appointments").update(
            {"status": "completed", "duration_minutes": duration // 60}
        ).eq("livekit_room", room_name).execute()

    return {"message": "Webhook processed successfully"}


@router.get("/appointments/{appointment_id}/queue-status")
async def get_queue_status(
    appointment_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """
    Get the current queue status for an appointment.
    """
    try:
        # Get queue entry
        queue_res = (
            supabase.table("waiting_queue")
            .select("*")
            .eq("appointment_id", appointment_id)
            .single()
            .execute()
        )

        if queue_res.data:
            return {
                "position": queue_res.data.get("position", 1),
                "estimated_wait_minutes": queue_res.data.get(
                    "estimated_wait_minutes", 5
                ),
                "status": queue_res.data.get("status", "waiting"),
            }
        else:
            # No queue entry, return default
            return {"position": 1, "estimated_wait_minutes": 5, "status": "waiting"}
    except Exception:
        # Return default if table doesn't exist yet
        return {"position": 1, "estimated_wait_minutes": 5, "status": "waiting"}


@router.post("/waiting-room/call-next")
async def call_next_patient(
    doctor_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """
    Call the next patient in the waiting queue.
    Doctor endpoint to notify the next patient.
    """
    try:
        # Get next patient in queue for this doctor
        queue_res = (
            supabase.table("waiting_queue")
            .select("*")
            .eq("doctor_id", doctor_id)
            .eq("status", "waiting")
            .order("position", desc=False)
            .limit(1)
            .execute()
        )

        if not queue_res.data:
            raise HTTPException(status_code=404, detail="No patients in queue")

        next_patient = queue_res.data[0]

        # Update status to 'called'
        supabase.table("waiting_queue").update({"status": "called"}).eq(
            "id", next_patient["id"]
        ).execute()

        # Update appointment status
        supabase.table("appointments").update({"status": "in_progress"}).eq(
            "id", next_patient["appointment_id"]
        ).execute()

        return {
            "message": "Patient called successfully",
            "patient_id": next_patient["patient_id"],
            "appointment_id": next_patient["appointment_id"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/waiting-room/update-position")
async def update_queue_positions(
    doctor_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """
    Recalculate queue positions after a patient is called or removed.
    """
    try:
        # Get all waiting patients for this doctor
        queue_res = (
            supabase.table("waiting_queue")
            .select("*")
            .eq("doctor_id", doctor_id)
            .eq("status", "waiting")
            .order("created_at", desc=False)
            .execute()
        )

        if queue_res.data:
            # Update positions
            for idx, entry in enumerate(queue_res.data, start=1):
                supabase.table("waiting_queue").update(
                    {
                        "position": idx,
                        "estimated_wait_minutes": idx * 5,  # 5 minutes per patient
                    }
                ).eq("id", entry["id"]).execute()

        return {"message": "Queue positions updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class RecordStartRequest(BaseModel):
    room_name: str


class RecordStopRequest(BaseModel):
    egress_id: str


@router.post("/record/start")
async def api_start_recording(
    req: RecordStartRequest, current_user: TokenPayload = Depends(get_current_user)
):
    """
    Start recording a LiveKit room. Only doctors can initiate recordings.
    """
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=403, detail="Only doctors can record consultations"
        )
    try:
        egress_id = await start_room_recording(req.room_name)
        return {"success": True, "egress_id": egress_id}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to start recording: {str(e)}"
        )


@router.post("/record/stop")
async def api_stop_recording(
    req: RecordStopRequest, current_user: TokenPayload = Depends(get_current_user)
):
    """
    Stop an active LiveKit room recording.
    """
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=403, detail="Only doctors can record consultations"
        )
    try:
        success = await stop_room_recording(req.egress_id)
        return {"success": success}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to stop recording: {str(e)}"
        )
