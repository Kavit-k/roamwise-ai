import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from app.core.security import get_current_user, AuthenticatedUser, security_bearer
from app.schemas.trip import TripCreateRequest, TripUpdateRequest, TripResponse
from app.services.groq_service import groq_service
from app.services.trip_service import trip_service

router = APIRouter(prefix="/trips", tags=["Trips"])


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(
    req: TripCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
):
    """
    Creates a new personalized travel itinerary via Groq AI
    and persists the validated trip in Supabase PostgreSQL with RLS.
    """
    s_date = date.fromisoformat(req.start_date)
    e_date = date.fromisoformat(req.end_date)
    duration_days = (e_date - s_date).days + 1

    # 1. Generate itinerary using Groq LLM
    itinerary = groq_service.generate_itinerary(req, duration_days)

    # 2. Persist to Supabase
    token = credentials.credentials if credentials else None
    saved_trip = trip_service.create_trip(
        user_id=current_user.id,
        req=req,
        itinerary=itinerary,
        token=token
    )
    return saved_trip


@router.get("", response_model=List[TripResponse])
def list_trips(
    current_user: AuthenticatedUser = Depends(get_current_user),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
):
    """
    Retrieves all saved trips belonging to the authenticated user.
    """
    token = credentials.credentials if credentials else None
    return trip_service.list_trips(user_id=current_user.id, token=token)


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
):
    """
    Retrieves a single trip by ID. Enforces ownership authorization.
    """
    token = credentials.credentials if credentials else None
    return trip_service.get_trip(trip_id=trip_id, user_id=current_user.id, token=token)


@router.patch("/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: uuid.UUID,
    updates: TripUpdateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
):
    """
    Updates trip title, status, preferences, or itinerary structure.
    """
    token = credentials.credentials if credentials else None
    update_data = updates.model_dump(exclude_unset=True)
    return trip_service.update_trip(
        trip_id=trip_id,
        user_id=current_user.id,
        updates=update_data,
        token=token
    )


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
):
    """
    Permanently deletes a saved trip owned by the authenticated user.
    """
    token = credentials.credentials if credentials else None
    trip_service.delete_trip(trip_id=trip_id, user_id=current_user.id, token=token)
    return None
