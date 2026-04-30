from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import logging
from pydantic import BaseModel

from app.core.security import get_current_user
from app.models.schemas import TokenPayload
from app.services.supabase import supabase
from app.db.schema import Tables, Col
import re

logger = logging.getLogger(__name__)


MOCK_MESSAGES_DB: List[Dict[str, Any]] = []

router = APIRouter(prefix="/messages", tags=["Messages"])


class SendMessageRequest(BaseModel):
    recipient_id: str
    content: str
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None
    reply_to_id: Optional[str] = None


@router.get("/conversations")
async def get_conversations(current_user: TokenPayload = Depends(get_current_user)):
    """Get all conversations for current user."""
    try:
        # Get unique conversation partners
        sent_res = (
            supabase.table(Tables.MESSAGES)
            .select(Col.Messages.RECIPIENT_ID)
            .eq(Col.Messages.SENDER_ID, current_user.sub)
            .execute()
        )
        received_res = (
            supabase.table(Tables.MESSAGES)
            .select(Col.Messages.SENDER_ID)
            .eq(Col.Messages.RECIPIENT_ID, current_user.sub)
            .execute()
        )

        partner_ids = set()
        if sent_res.data:
            partner_ids.update(
                [msg[Col.Messages.RECIPIENT_ID] for msg in sent_res.data]
            )
        if received_res.data:
            partner_ids.update(
                [msg[Col.Messages.SENDER_ID] for msg in received_res.data]
            )

        if current_user.sub == "00000000-0000-0000-0000-000000000000":
            for m in MOCK_MESSAGES_DB:
                if m.get("sender_id") == current_user.sub:
                    partner_ids.add(m.get("recipient_id"))
                if m.get("recipient_id") == current_user.sub:
                    partner_ids.add(m.get("sender_id"))

        conversations = []
        for partner_id in partner_ids:
            # Get last message
            last_msg = None
            if current_user.sub == "00000000-0000-0000-0000-000000000000":
                partner_msgs = [
                    m
                    for m in MOCK_MESSAGES_DB
                    if (
                        m.get("sender_id") == current_user.sub
                        and m.get("recipient_id") == partner_id
                    )
                    or (
                        m.get("sender_id") == partner_id
                        and m.get("recipient_id") == current_user.sub
                    )
                ]
                if partner_msgs:
                    partner_msgs.sort(
                        key=lambda x: x.get("created_at", ""), reverse=True
                    )
                    last_msg = partner_msgs[0]

            if not last_msg:
                last_msg_res = (
                    supabase.table(Tables.MESSAGES)
                    .select("*")
                    .or_(
                        f"and(sender_id.eq.{current_user.sub},recipient_id.eq.{partner_id}),and(sender_id.eq.{partner_id},recipient_id.eq.{current_user.sub})"
                    )
                    .order(Col.Messages.CREATED_AT, desc=True)
                    .limit(1)
                    .execute()
                )
                last_msg = last_msg_res.data[0] if last_msg_res.data else None

            # Get unread count
            unread_res = (
                supabase.table(Tables.MESSAGES)
                .select(Col.Messages.ID, count="exact")
                .eq(Col.Messages.SENDER_ID, partner_id)
                .eq(Col.Messages.RECIPIENT_ID, current_user.sub)
                .eq(Col.Messages.READ, False)
                .execute()
            )

            # Get partner info
            partner_name = "Unknown"
            partner_avatar = None
            partner_role = "admin"  # Assume admin to prevent replies if it's not a known patient/doctor

            pat_res = (
                supabase.table(Tables.PROFILES_PATIENT)
                .select(
                    f"{Col.ProfilesPatient.FULL_NAME},{Col.ProfilesPatient.AVATAR_URL}"
                )
                .eq(Col.ProfilesPatient.ID, partner_id)
                .execute()
            )
            if pat_res.data:
                partner_name = pat_res.data[0].get(
                    Col.ProfilesPatient.FULL_NAME, "Unknown"
                )
                partner_avatar = pat_res.data[0].get(Col.ProfilesPatient.AVATAR_URL)
                partner_role = "patient"
            else:
                doc_res = (
                    supabase.table(Tables.PROFILES_DOCTOR)
                    .select(
                        f"{Col.ProfilesDoctor.FULL_NAME},{Col.ProfilesDoctor.AVATAR_URL}"
                    )
                    .eq(Col.ProfilesDoctor.ID, partner_id)
                    .execute()
                )
                if doc_res.data:
                    partner_name = doc_res.data[0].get(
                        Col.ProfilesDoctor.FULL_NAME, "Unknown"
                    )
                    partner_avatar = doc_res.data[0].get(Col.ProfilesDoctor.AVATAR_URL)
                    partner_role = "doctor"
                else:
                    partner_name = "Netra Admin"

            conversations.append(
                {
                    "partner_id": partner_id,
                    "partner_name": partner_name,
                    "partner_avatar": partner_avatar,
                    "partner_role": partner_role,
                    "last_message": last_msg,
                    "unread_count": (
                        unread_res.count if hasattr(unread_res, "count") else 0
                    ),
                }
            )

        return conversations
    except Exception as e:
        logger.error(f"Error fetching conversations: {e}")
        # Return mock data for testing when Supabase is not configured
        if "your-project" in str(e) or "Name or service not known" in str(e):
            logger.warning("Supabase not configured - returning mock conversations")
            return [
                {
                    "partner_id": "d1000000-0000-0000-0000-000000000002",
                    "partner_name": "Dr. Test Doctor",
                    "partner_avatar": None,
                    "partner_role": "doctor",
                    "last_message": {
                        "id": str(uuid.uuid4()),
                        "content": "Hello! How are you feeling today?",
                        "created_at": datetime.now().isoformat(),
                        "sender_id": "d1000000-0000-0000-0000-000000000002",
                    },
                    "unread_count": 0,
                }
            ]
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{partner_id}")
async def get_messages(
    partner_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Get messages with a specific user."""
    # Check if mock messages exist for this bypass user
    if current_user.sub == "00000000-0000-0000-0000-000000000000":
        mock_msgs = [
            m
            for m in MOCK_MESSAGES_DB
            if (
                m.get("sender_id") == current_user.sub
                and m.get("recipient_id") == partner_id
            )
            or (
                m.get("sender_id") == partner_id
                and m.get("recipient_id") == current_user.sub
            )
        ]
        if mock_msgs:
            mock_msgs.sort(key=lambda x: x.get("created_at", ""))
            return mock_msgs

    try:
        res = (
            supabase.table(Tables.MESSAGES)
            .select("*")
            .or_(
                f"and(sender_id.eq.{current_user.sub},recipient_id.eq.{partner_id}),and(sender_id.eq.{partner_id},recipient_id.eq.{current_user.sub})"
            )
            .order(Col.Messages.CREATED_AT, desc=False)
            .range(offset, offset + limit - 1)
            .execute()
        )

        # Mark messages as read
        res = (
            supabase.table(Tables.MESSAGES)
            .update({Col.Messages.READ: True})
            .eq(Col.Messages.SENDER_ID, partner_id)
            .eq(Col.Messages.RECIPIENT_ID, current_user.sub)
            .eq(Col.Messages.READ, False)
            .execute()
        )

        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        # Return mock data for testing when Supabase is not configured
        error_str = str(e).lower()
        if (
            "your-project" in error_str
            or "name or service not known" in error_str
            or "connection" in error_str
        ):
            logger.warning("Supabase not configured - returning mock messages")
            return [
                {
                    "id": str(uuid.uuid4()),
                    "sender_id": partner_id,
                    "recipient_id": current_user.sub,
                    "content": "Hi! How can I help you today?",
                    "read": True,
                    "created_at": datetime.now().isoformat(),
                },
                {
                    "id": str(uuid.uuid4()),
                    "sender_id": current_user.sub,
                    "recipient_id": partner_id,
                    "content": "I have a question about my prescription",
                    "read": True,
                    "created_at": datetime.now().isoformat(),
                },
            ]
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{partner_id}/read")
async def mark_messages_read(
    partner_id: str, current_user: TokenPayload = Depends(get_current_user)
):
    """Mark messages from a specific user as read."""
    try:
        supabase.table(Tables.MESSAGES).update({Col.Messages.READ: True}).eq(
            Col.Messages.SENDER_ID, partner_id
        ).eq(Col.Messages.RECIPIENT_ID, current_user.sub).eq(
            Col.Messages.READ, False
        ).execute()
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error marking messages as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send")
@router.post("")  # Legacy support for frontend versions calling /api/v1/messages
async def send_message(
    body: SendMessageRequest, current_user: TokenPayload = Depends(get_current_user)
):
    """Send a message. Accepts a JSON body with recipient_id, content, and optional fields."""
    recipient_id = body.recipient_id
    content = body.content
    attachment_url = body.attachment_url
    attachment_type = body.attachment_type
    reply_to_id = body.reply_to_id

    try:
        # Check if one-way chat rule applies
        user_role_val = (
            current_user.role.value
            if hasattr(current_user.role, "value")
            else str(current_user.role)
        )
        if user_role_val != "admin":
            pat_res = (
                supabase.table(Tables.PROFILES_PATIENT)
                .select(Col.ProfilesPatient.ID)
                .eq(Col.ProfilesPatient.ID, recipient_id)
                .execute()
            )
            doc_res = (
                supabase.table(Tables.PROFILES_DOCTOR)
                .select(Col.ProfilesDoctor.ID)
                .eq(Col.ProfilesDoctor.ID, recipient_id)
                .execute()
            )
            if not pat_res.data and not doc_res.data:
                raise HTTPException(
                    status_code=403,
                    detail="You cannot reply to system or administrative announcements.",
                )

        insert_data = {
            Col.Messages.SENDER_ID: current_user.sub,
            Col.Messages.RECIPIENT_ID: recipient_id,
            Col.Messages.CONTENT: content,
            Col.Messages.READ: False,
        }
        if attachment_url:
            insert_data[Col.Messages.ATTACHMENT_URL] = attachment_url
        if attachment_type:
            insert_data["attachment_type"] = attachment_type
        if reply_to_id:
            insert_data["reply_to_id"] = reply_to_id
        res = supabase.table(Tables.MESSAGES).insert(insert_data).execute()

        return res.data[0] if res.data else {}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        # Return mock data for testing when Supabase is not configured
        if "your-project" in str(e) or "Name or service not known" in str(e):
            logger.warning("Supabase not configured - returning mock message response")
            return {
                "id": str(uuid.uuid4()),
                "sender_id": current_user.sub,
                "recipient_id": recipient_id,
                "content": content,
                "read": False,
                "created_at": datetime.now().isoformat(),
                "attachment_url": attachment_url,
                "attachment_type": attachment_type,
                "reply_to_id": reply_to_id,
            }
        # If testing with mock bypass dummy accounts, return a successful mock row
        if (
            "foreign key constraint" in str(e).lower()
            or "not present in table" in str(e).lower()
        ):
            mock_msg = {
                "id": str(uuid.uuid4()),
                "sender_id": current_user.sub,
                "recipient_id": recipient_id,
                "content": content,
                "read": False,
                "created_at": datetime.now().isoformat(),
                "attachment_url": attachment_url,
                "attachment_type": attachment_type,
                "reply_to_id": reply_to_id,
            }
            MOCK_MESSAGES_DB.append(mock_msg)
            return mock_msg
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-attachment")
@router.post("/upload")  # Legacy support
async def upload_attachment(
    file: UploadFile = File(...), current_user: TokenPayload = Depends(get_current_user)
):
    """Upload message attachment."""
    try:
        contents = await file.read()
        # Preserve original filename but clean it for URL safety
        safe_name = file.filename if file.filename else "attachment"
        clean_filename = re.sub(r"[^a-zA-Z0-9_.-]", "_", safe_name)
        # Prepend a short UUID to avoid collisions without losing the name
        unique_filename = (
            f"messages/{current_user.sub}/{uuid.uuid4().hex[:8]}_{clean_filename}"
        )

        # Upload to Supabase Storage
        try:
            supabase.storage.create_bucket("attachments", options={"public": True})
        except Exception as e:
            logger.debug(f"Bucket creation skipped (may already exist): {e}")

        supabase.storage.from_("attachments").upload(
            path=unique_filename,
            file=contents,
            file_options={"content-type": file.content_type},
        )

        public_url = supabase.storage.from_("attachments").get_public_url(
            unique_filename
        )

        return {"url": public_url}
    except Exception as e:
        logger.error(f"Error uploading attachment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unread/count")
async def get_unread_count(current_user: TokenPayload = Depends(get_current_user)):
    """Get unread message count."""
    try:
        res = (
            supabase.table(Tables.MESSAGES)
            .select(Col.Messages.ID, count="exact")
            .eq(Col.Messages.RECIPIENT_ID, current_user.sub)
            .eq(Col.Messages.READ, False)
            .execute()
        )
        return {"count": res.count if hasattr(res, "count") else 0}
    except Exception as e:
        logger.error(f"Error fetching unread count: {e}")
        raise HTTPException(status_code=500, detail=str(e))
