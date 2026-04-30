from fastapi import APIRouter, Query
from typing import List, Optional, Any, Iterable, cast
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


class Hospital(BaseModel):
    id: int
    name: str
    address: str
    distance: str
    latitude: float
    longitude: float
    rating: float
    phone: str
    hours: str
    specialties: List[str]
    type: str


# Mock hospitals data for Mumbai (user's current location)
MOCK_HOSPITALS_MUMBAI = [
    {
        "id": 1,
        "name": "Apollo Hospitals",
        "address": "Plot No 40, Sector 6, Navi Mumbai, Maharashtra 400703",
        "distance": "2.3 km",
        "latitude": 19.0176,
        "longitude": 73.0196,
        "rating": 4.8,
        "phone": "+91-22-6789-0123",
        "hours": "24/7",
        "specialties": ["Hematology", "General Medicine", "Pathology"],
        "type": "Multi-specialty",
    },
    {
        "id": 2,
        "name": "Fortis Hospital",
        "address": "Forjett Street, Mumbai Central, Maharashtra 400008",
        "distance": "3.1 km",
        "latitude": 19.0176,
        "longitude": 72.8479,
        "rating": 4.7,
        "phone": "+91-22-6150-1234",
        "hours": "24/7",
        "specialties": ["Internal Medicine", "Emergency Medicine"],
        "type": "Multi-specialty",
    },
    {
        "id": 3,
        "name": "Max Healthcare",
        "address": "Sector 15, Kasara, Thane, Maharashtra 421301",
        "distance": "4.7 km",
        "latitude": 19.2183,
        "longitude": 72.9781,
        "rating": 4.6,
        "phone": "+91-22-4245-0000",
        "hours": "24/7",
        "specialties": ["Hematology", "Surgery", "Pediatrics"],
        "type": "Multi-specialty",
    },
    {
        "id": 4,
        "name": "Breach Candy Hospital",
        "address": "60 Bhulabhai Desai Road, Kemps Corner, Mumbai 400026",
        "distance": "5.2 km",
        "latitude": 19.0176,
        "longitude": 72.8267,
        "rating": 4.9,
        "phone": "+91-22-6054-3535",
        "hours": "24/7",
        "specialties": ["Hematology", "General Medicine", "Cardiology"],
        "type": "Super-specialty",
    },
    {
        "id": 5,
        "name": "Sir HN Reliance Foundation Hospital",
        "address": "Raja S C Mullick Road, Girgaum, Mumbai 400004",
        "distance": "6.1 km",
        "latitude": 19.0088,
        "longitude": 72.8251,
        "rating": 4.8,
        "phone": "+91-22-4010-5555",
        "hours": "24/7",
        "specialties": ["General Medicine", "Pathology", "Diagnostics"],
        "type": "Multi-specialty",
    },
    {
        "id": 6,
        "name": "Hiranandani Hospital",
        "address": "Sunil Nagar, Powai, Mumbai 400076",
        "distance": "7.5 km",
        "latitude": 19.0960,
        "longitude": 72.9054,
        "rating": 4.5,
        "phone": "+91-22-6142-7000",
        "hours": "24/7",
        "specialties": ["Internal Medicine", "Diagnostics"],
        "type": "Multi-specialty",
    },
    {
        "id": 7,
        "name": "Lilavati Hospital",
        "address": "A-791 Bandra Reclamation, Bandra, Mumbai 400050",
        "distance": "8.3 km",
        "latitude": 19.0596,
        "longitude": 72.8295,
        "rating": 4.7,
        "phone": "+91-22-6767-7777",
        "hours": "24/7",
        "specialties": ["Hematology", "Oncology", "Emergency"],
        "type": "Super-specialty",
    },
    {
        "id": 8,
        "name": "Kokilaben Hospital",
        "address": "Nivi Heights, Plot No 801, Mumbai Central 400004",
        "distance": "9.1 km",
        "latitude": 19.0068,
        "longitude": 72.8229,
        "rating": 4.9,
        "phone": "+91-22-4010-3333",
        "hours": "24/7",
        "specialties": ["Hematology", "Pathology", "General Medicine"],
        "type": "Multi-specialty",
    },
]


@router.get("", response_model=List[Hospital])
async def get_nearby_hospitals(
    lat: Optional[float] = None, lon: Optional[float] = None, distance_km: int = 10
):
    """Get hospitals near a location (returns mock Mumbai hospitals by default)."""
    # If coordinates are not provided or too far from Mumbai, return mock Mumbai hospitals
    if not lat or not lon:
        return MOCK_HOSPITALS_MUMBAI

    # Simple distance check (if they provide coords, still return Mumbai hospitals for demo)
    # In production, this would calculate actual distance
    return MOCK_HOSPITALS_MUMBAI


@router.get("/search")
async def search_hospitals(q: str = Query(..., min_length=1)):
    """Search hospitals by name or location."""
    q_lower = q.lower()
    results = [
        h
        for h in MOCK_HOSPITALS_MUMBAI
        if q_lower in str(h["name"]).lower()
        or q_lower in str(h["address"]).lower()
        or q_lower
        in " ".join(str(spec) for spec in cast(Iterable[Any], h["specialties"])).lower()
    ]
    return results
