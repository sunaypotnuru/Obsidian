"""
Security Management Routes
Provides session management, failed login tracking, and IP whitelist management.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime, timedelta
from app.core.security import get_current_admin, TokenPayload
from app.services.supabase import supabase

router = APIRouter(prefix="/admin/security", tags=["admin", "security"])


class IPWhitelistEntry(BaseModel):
    ip_address: str
    description: Optional[str] = None
    expires_at: Optional[datetime] = None


@router.get("/sessions")
async def get_active_sessions(current_user: TokenPayload = Depends(get_current_admin)):
    """
    Get all active user sessions.

    Returns:
    - List of active sessions with user info, device info, and last activity
    """
    try:
        # Query user_sessions table
        result = (
            supabase.table("user_sessions")
            .select("*, profiles(email, role)")
            .eq("is_active", True)
            .order("last_activity", desc=True)
            .execute()
        )

        sessions = []
        for session in result.data if result.data else []:
            sessions.append(
                {
                    "session_id": session["session_id"],
                    "user_id": session["user_id"],
                    "user_email": session.get("profiles", {}).get("email"),
                    "user_role": session.get("profiles", {}).get("role"),
                    "device_info": session.get("device_info", {}),
                    "ip_address": session.get("ip_address"),
                    "created_at": session["created_at"],
                    "last_activity": session["last_activity"],
                    "expires_at": session["expires_at"],
                }
            )

        return {
            "sessions": sessions,
            "total_active_sessions": len(sessions),
            "timestamp": datetime.now().isoformat(),
        }
    except Exception:
        # If table doesn't exist, return empty list
        return {
            "sessions": [],
            "total_active_sessions": 0,
            "timestamp": datetime.now().isoformat(),
            "note": "Session tracking not yet initialized",
        }


@router.delete("/sessions/{session_id}")
async def force_logout_session(
    session_id: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """
    Force logout a specific session.

    Parameters:
    - session_id: The session ID to terminate

    Returns:
    - Confirmation message
    """
    try:
        # Get session details before deletion
        session_result = (
            supabase.table("user_sessions")
            .select("user_id, ip_address")
            .eq("session_id", session_id)
            .execute()
        )

        if not session_result.data or len(session_result.data) == 0:
            raise HTTPException(status_code=404, detail="Session not found")

        session_data = session_result.data[0]

        # Mark session as inactive
        supabase.table("user_sessions").update(
            {
                "is_active": False,
                "terminated_at": datetime.now().isoformat(),
                "terminated_by": current_user.sub,
            }
        ).eq("session_id", session_id).execute()

        # Log the forced logout
        supabase.table("audit_logs").insert(
            {
                "user_id": current_user.sub,
                "user_role": current_user.role,
                "action": "FORCE_LOGOUT",
                "resource_type": "user_session",
                "resource_id": session_id,
                "details": {
                    "session_id": session_id,
                    "target_user_id": session_data["user_id"],
                    "ip_address": session_data.get("ip_address"),
                },
                "status": "SUCCESS",
                "phi_accessed": False,
            }
        ).execute()

        return {
            "message": "Session terminated successfully",
            "session_id": session_id,
            "timestamp": datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to terminate session: {str(e)}"
        )


@router.delete("/sessions/user/{user_id}")
async def force_logout_user_sessions(
    user_id: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """
    Force logout all sessions for a specific user.

    Parameters:
    - user_id: The user ID whose sessions to terminate

    Returns:
    - Number of sessions terminated
    """
    try:
        # Get all active sessions for user
        sessions_result = (
            supabase.table("user_sessions")
            .select("session_id")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .execute()
        )

        session_count = len(sessions_result.data) if sessions_result.data else 0

        if session_count == 0:
            return {
                "message": "No active sessions found for user",
                "sessions_terminated": 0,
                "timestamp": datetime.now().isoformat(),
            }

        # Mark all sessions as inactive
        supabase.table("user_sessions").update(
            {
                "is_active": False,
                "terminated_at": datetime.now().isoformat(),
                "terminated_by": current_user.sub,
            }
        ).eq("user_id", user_id).eq("is_active", True).execute()

        # Log the forced logout
        supabase.table("audit_logs").insert(
            {
                "user_id": current_user.sub,
                "user_role": current_user.role,
                "action": "FORCE_LOGOUT_ALL",
                "resource_type": "user_session",
                "resource_id": user_id,
                "details": {
                    "target_user_id": user_id,
                    "sessions_terminated": session_count,
                },
                "status": "SUCCESS",
                "phi_accessed": False,
            }
        ).execute()

        return {
            "message": "All sessions terminated for user",
            "user_id": user_id,
            "sessions_terminated": session_count,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to terminate sessions: {str(e)}"
        )


@router.get("/failed-logins")
async def get_failed_logins(
    hours: int = 24,
    limit: int = 100,
    current_user: TokenPayload = Depends(get_current_admin),
):
    """
    Get recent failed login attempts.

    Parameters:
    - hours: Number of hours to look back (default: 24)
    - limit: Maximum number of results (default: 100)

    Returns:
    - List of failed login attempts with IP addresses and timestamps
    """
    try:
        # Calculate time range
        start_time = datetime.now() - timedelta(hours=hours)

        # Query audit logs for failed logins
        result = (
            supabase.table("audit_logs")
            .select("*")
            .eq("action", "LOGIN")
            .eq("status", "FAILURE")
            .gte("timestamp", start_time.isoformat())
            .order("timestamp", desc=True)
            .limit(limit)
            .execute()
        )

        failed_logins = []
        ip_counts: Dict[str, int] = {}

        for log in result.data if result.data else []:
            failed_logins.append(
                {
                    "timestamp": log["timestamp"],
                    "ip_address": log.get("ip_address"),
                    "user_agent": log.get("user_agent"),
                    "details": log.get("details", {}),
                }
            )

            # Count by IP
            ip = log.get("ip_address", "unknown")
            ip_counts[ip] = ip_counts.get(ip, 0) + 1

        # Find suspicious IPs (more than 5 failed attempts)
        suspicious_ips = [
            {"ip": ip, "attempts": count}
            for ip, count in ip_counts.items()
            if count >= 5
        ]

        return {
            "failed_logins": failed_logins,
            "total_failed_attempts": len(failed_logins),
            "suspicious_ips": suspicious_ips,
            "time_range_hours": hours,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception:
        return {
            "failed_logins": [],
            "total_failed_attempts": 0,
            "suspicious_ips": [],
            "time_range_hours": hours,
            "timestamp": datetime.now().isoformat(),
            "note": "Failed login tracking not yet initialized",
        }


@router.get("/ip-whitelist")
async def get_ip_whitelist(current_user: TokenPayload = Depends(get_current_admin)):
    """
    Get the current IP whitelist.

    Returns:
    - List of whitelisted IP addresses with descriptions and expiration
    """
    try:
        result = (
            supabase.table("ip_whitelist")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )

        whitelist = []
        for entry in result.data if result.data else []:
            # Check if expired
            is_expired = False
            if entry.get("expires_at"):
                expires_at = datetime.fromisoformat(
                    entry["expires_at"].replace("Z", "+00:00")
                )
                is_expired = expires_at < datetime.now()

            whitelist.append(
                {
                    "id": entry["id"],
                    "ip_address": entry["ip_address"],
                    "description": entry.get("description"),
                    "created_at": entry["created_at"],
                    "created_by": entry.get("created_by"),
                    "expires_at": entry.get("expires_at"),
                    "is_expired": is_expired,
                }
            )

        return {
            "whitelist": whitelist,
            "total_entries": len(whitelist),
            "timestamp": datetime.now().isoformat(),
        }
    except Exception:
        return {
            "whitelist": [],
            "total_entries": 0,
            "timestamp": datetime.now().isoformat(),
            "note": "IP whitelist not yet initialized",
        }


@router.post("/ip-whitelist")
async def add_ip_to_whitelist(
    entry: IPWhitelistEntry, current_user: TokenPayload = Depends(get_current_admin)
):
    """
    Add an IP address to the whitelist.

    Body:
    - ip_address: IP address to whitelist
    - description: Optional description
    - expires_at: Optional expiration datetime

    Returns:
    - Confirmation message
    """
    try:
        # Check if IP already exists
        existing = (
            supabase.table("ip_whitelist")
            .select("id")
            .eq("ip_address", entry.ip_address)
            .execute()
        )

        if existing.data and len(existing.data) > 0:
            raise HTTPException(
                status_code=400, detail="IP address already whitelisted"
            )

        # Add to whitelist
        supabase.table("ip_whitelist").insert(
            {
                "ip_address": entry.ip_address,
                "description": entry.description,
                "expires_at": (
                    entry.expires_at.isoformat() if entry.expires_at else None
                ),
                "created_by": current_user.sub,
                "created_at": datetime.now().isoformat(),
            }
        ).execute()

        # Log the action
        supabase.table("audit_logs").insert(
            {
                "user_id": current_user.sub,
                "user_role": current_user.role,
                "action": "ADD_IP_WHITELIST",
                "resource_type": "ip_whitelist",
                "resource_id": entry.ip_address,
                "details": {
                    "ip_address": entry.ip_address,
                    "description": entry.description,
                    "expires_at": (
                        entry.expires_at.isoformat() if entry.expires_at else None
                    ),
                },
                "status": "SUCCESS",
                "phi_accessed": False,
            }
        ).execute()

        return {
            "message": "IP address added to whitelist successfully",
            "ip_address": entry.ip_address,
            "timestamp": datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to add IP to whitelist: {str(e)}"
        )


@router.delete("/ip-whitelist/{ip_address}")
async def remove_ip_from_whitelist(
    ip_address: str, current_user: TokenPayload = Depends(get_current_admin)
):
    """
    Remove an IP address from the whitelist.

    Parameters:
    - ip_address: IP address to remove

    Returns:
    - Confirmation message
    """
    try:
        # Delete from whitelist
        result = (
            supabase.table("ip_whitelist")
            .delete()
            .eq("ip_address", ip_address)
            .execute()
        )

        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=404, detail="IP address not found in whitelist"
            )

        # Log the action
        supabase.table("audit_logs").insert(
            {
                "user_id": current_user.sub,
                "user_role": current_user.role,
                "action": "REMOVE_IP_WHITELIST",
                "resource_type": "ip_whitelist",
                "resource_id": ip_address,
                "details": {"ip_address": ip_address},
                "status": "SUCCESS",
                "phi_accessed": False,
            }
        ).execute()

        return {
            "message": "IP address removed from whitelist successfully",
            "ip_address": ip_address,
            "timestamp": datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to remove IP from whitelist: {str(e)}"
        )


@router.get("/alerts")
async def get_security_alerts(
    hours: int = 24, current_user: TokenPayload = Depends(get_current_admin)
):
    """
    Get recent security alerts.

    Parameters:
    - hours: Number of hours to look back (default: 24)

    Returns:
    - List of security-related events and alerts
    """
    try:
        start_time = datetime.now() - timedelta(hours=hours)

        # Query audit logs for security events
        result = (
            supabase.table("audit_logs")
            .select("*")
            .in_(
                "action",
                [
                    "FORCE_LOGOUT",
                    "FORCE_LOGOUT_ALL",
                    "ADD_IP_WHITELIST",
                    "REMOVE_IP_WHITELIST",
                    "LOGIN",
                ],
            )
            .gte("timestamp", start_time.isoformat())
            .order("timestamp", desc=True)
            .execute()
        )

        alerts = []
        for log in result.data if result.data else []:
            severity = "low"
            if log["action"] in ["FORCE_LOGOUT", "FORCE_LOGOUT_ALL"]:
                severity = "high"
            elif log["status"] == "FAILURE":
                severity = "medium"

            alerts.append(
                {
                    "timestamp": log["timestamp"],
                    "action": log["action"],
                    "user_id": log.get("user_id"),
                    "user_role": log.get("user_role"),
                    "ip_address": log.get("ip_address"),
                    "status": log.get("status"),
                    "severity": severity,
                    "details": log.get("details", {}),
                }
            )

        return {
            "alerts": alerts,
            "total_alerts": len(alerts),
            "time_range_hours": hours,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception:
        return {
            "alerts": [],
            "total_alerts": 0,
            "time_range_hours": hours,
            "timestamp": datetime.now().isoformat(),
            "note": "Security alerts not yet initialized",
        }
