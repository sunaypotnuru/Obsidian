"""
System Health Monitoring Routes
Provides real-time health status of all 8 microservices and system metrics.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Any
from datetime import datetime, timedelta
import httpx
import asyncio
from app.core.security import get_current_admin
from app.models.schemas import TokenPayload
from app.services.supabase import supabase

router = APIRouter(prefix="/admin/system-health", tags=["admin", "system-health"])

# Microservice endpoints
MICROSERVICES = {
    "core": "http://localhost:8000/health",
    "anemia": "http://localhost:8001/health",
    "cataract": "http://localhost:8002/health",
    "diabetic-retinopathy": "http://localhost:8003/health",
    "parkinsons-voice": "http://localhost:8004/health",
    "mental-health": "http://localhost:8005/health",
    "mental-health-chatbot": "http://localhost:8006/health",
    "emergency-services": "http://localhost:8007/health",
}


async def check_service_health(service_name: str, url: str) -> Dict:
    """Check health of a single microservice."""
    try:
        start_time = datetime.now()
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url)
            latency_ms = (datetime.now() - start_time).total_seconds() * 1000

            return {
                "name": service_name,
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "latency_ms": round(latency_ms, 2),
                "status_code": response.status_code,
                "last_check": datetime.now().isoformat(),
                "error_message": None,
            }
    except httpx.TimeoutException:
        return {
            "name": service_name,
            "status": "timeout",
            "latency_ms": 5000,
            "status_code": None,
            "last_check": datetime.now().isoformat(),
            "error_message": "Service timeout after 5 seconds",
        }
    except Exception as e:
        return {
            "name": service_name,
            "status": "down",
            "latency_ms": None,
            "status_code": None,
            "last_check": datetime.now().isoformat(),
            "error_message": str(e),
        }


async def check_database_health() -> Dict:
    """Check database connectivity and performance."""
    try:
        start_time = datetime.now()
        # Simple query to test database
        # Use a stable, always-present table in our schema.
        supabase.table("profiles_patient").select("id").limit(1).execute()
        latency_ms = (datetime.now() - start_time).total_seconds() * 1000

        return {
            "status": "healthy",
            "latency_ms": round(latency_ms, 2),
            "connected": True,
            "error_message": None,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "latency_ms": None,
            "connected": False,
            "error_message": str(e),
        }


@router.get("")
async def get_system_health(current_user: TokenPayload = Depends(get_current_admin)):
    """
    Get current health status of all microservices and system components.

    Returns:
    - Service health for all 8 microservices
    - Database connectivity
    - Overall system status
    - Response times
    - Error rates
    """
    # Check all microservices concurrently
    service_checks = [
        check_service_health(name, url) for name, url in MICROSERVICES.items()
    ]
    service_results = await asyncio.gather(*service_checks)

    # Check database
    database_health = await check_database_health()

    # Calculate overall system status
    healthy_services = sum(1 for s in service_results if s["status"] == "healthy")
    total_services = len(service_results)

    overall_status = (
        "healthy"
        if healthy_services == total_services
        else "degraded" if healthy_services > 0 else "down"
    )

    # Calculate average response time
    response_times = [
        s["latency_ms"] for s in service_results if s["latency_ms"] is not None
    ]
    avg_response_time = (
        round(sum(response_times) / len(response_times), 2) if response_times else None
    )

    # Calculate uptime percentage (based on current check)
    uptime_percentage = round((healthy_services / total_services) * 100, 2)

    return {
        "overall_status": overall_status,
        "timestamp": datetime.now().isoformat(),
        "services": service_results,
        "database": database_health,
        "metrics": {
            "healthy_services": healthy_services,
            "total_services": total_services,
            "uptime_percentage": uptime_percentage,
            "avg_response_time_ms": avg_response_time,
        },
    }


@router.get("/history")
async def get_system_health_history(
    hours: int = 24, current_user: TokenPayload = Depends(get_current_admin)
):
    """
    Get historical health data for system monitoring.

    Parameters:
    - hours: Number of hours of history to retrieve (default: 24)

    Returns:
    - Historical health check data
    - Uptime statistics
    - Response time trends
    - Error rate trends
    """
    try:
        # Calculate time range
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=hours)

        # Query service_health table for historical data
        result = (
            supabase.table("service_health")
            .select("*")
            .gte("checked_at", start_time.isoformat())
            .lte("checked_at", end_time.isoformat())
            .order("checked_at", desc=False)
            .execute()
        )

        health_records = result.data if result.data else []

        # Group by service
        services_history: Dict[str, List[Dict[str, Any]]] = {}
        for record in health_records:
            service_name = record["service_name"]
            if service_name not in services_history:
                services_history[service_name] = []
            services_history[service_name].append(
                {
                    "timestamp": record["checked_at"],
                    "status": record["status"],
                    "latency_ms": record["latency_ms"],
                    "error_message": record.get("error_message"),
                }
            )

        # Calculate statistics for each service
        service_stats = {}
        for service_name, history in services_history.items():
            total_checks = len(history)
            healthy_checks = sum(1 for h in history if h["status"] == "healthy")
            uptime_percentage = (
                round((healthy_checks / total_checks) * 100, 2)
                if total_checks > 0
                else 0
            )

            latencies = [
                h["latency_ms"] for h in history if h["latency_ms"] is not None
            ]
            avg_latency = (
                round(sum(latencies) / len(latencies), 2) if latencies else None
            )

            service_stats[service_name] = {
                "uptime_percentage": uptime_percentage,
                "total_checks": total_checks,
                "healthy_checks": healthy_checks,
                "avg_latency_ms": avg_latency,
                "history": history,
            }

        return {
            "time_range": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
                "hours": hours,
            },
            "services": service_stats,
            "total_records": len(health_records),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve health history: {str(e)}"
        )


@router.post("/check")
async def trigger_health_check(current_user: TokenPayload = Depends(get_current_admin)):
    """
    Manually trigger a health check and store results in database.

    This endpoint performs a health check and stores the results
    in the service_health table for historical tracking.
    """
    # Perform health check
    service_checks = [
        check_service_health(name, url) for name, url in MICROSERVICES.items()
    ]
    service_results = await asyncio.gather(*service_checks)

    # Store results in database
    try:
        for result in service_results:
            supabase.table("service_health").insert(
                {
                    "service_name": result["name"],
                    "status": result["status"],
                    "latency_ms": result["latency_ms"],
                    "error_message": result["error_message"],
                    "checked_at": datetime.now().isoformat(),
                }
            ).execute()

        return {
            "message": "Health check completed and stored",
            "timestamp": datetime.now().isoformat(),
            "services_checked": len(service_results),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to store health check results: {str(e)}"
        )
