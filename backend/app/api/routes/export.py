import uuid
import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import HTTPAuthorizationCredentials
from app.core.security import get_current_user, AuthenticatedUser, security_bearer
from app.schemas.itinerary import Itinerary
from app.services.trip_service import trip_service
from app.services.pdf_service import pdf_service

router = APIRouter(prefix="/trips/{trip_id}/export", tags=["Export"])


@router.get("/pdf")
def export_trip_to_pdf(
    trip_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
):
    """
    Renders and downloads a beautifully styled, publication-ready PDF
    of the trip itinerary using ReportLab.
    """
    token = credentials.credentials if credentials else None
    trip = trip_service.get_trip(trip_id, current_user.id, token)

    if not trip.itinerary:
        raise HTTPException(
            status_code=400,
            detail="Cannot export PDF: this trip does not have an active itinerary."
        )

    itinerary = Itinerary.model_validate(trip.itinerary)
    pdf_bytes = pdf_service.generate_trip_pdf(itinerary)

    # Sanitize destination name for a safe, professional filename
    dest_clean = re.sub(r"[^\w\-]", "", trip.destination.lower().replace(" ", "-"))
    filename = f"roamwise-{dest_clean}-trip.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "application/pdf",
        },
    )
