import uuid
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from app.core.security import get_current_user, AuthenticatedUser, security_bearer
from app.schemas.trip import (
    TripResponse,
    TripCreateRequest,
    DayRegenerateRequest,
    ActivityCreateRequest,
    ActivityUpdateRequest,
    ActivityDeleteRequest,
    ActivityReorderRequest,
)
from app.schemas.itinerary import Itinerary, Activity
from app.services.trip_service import trip_service
from app.services.groq_service import groq_service
from app.services.itinerary_service import itinerary_service

router = APIRouter(prefix="/trips/{trip_id}", tags=["Itinerary Customization"])


@router.post("/regenerate-day", response_model=TripResponse)
def regenerate_day(
    trip_id: uuid.UUID,
    req: DayRegenerateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
):
    """
    Regenerates activities for a single day while keeping the rest of the trip intact.
    Recalculates the budget totals and updates the trip in Supabase.
    """
    token = credentials.credentials if credentials else None
    trip = trip_service.get_trip(trip_id, current_user.id, token)
    if not trip.itinerary:
        raise HTTPException(status_code=400, detail="Trip has no generated itinerary.")

    itinerary = Itinerary.model_validate(trip.itinerary)
    current_day = itinerary_service.find_day(itinerary, req.day_number)

    # Compile surrounding day highlights for LLM context
    context_lines = []
    for d in itinerary.days:
        if d.day_number != req.day_number:
            context_lines.append(f"Day {d.day_number} ({d.date}): {d.theme}")
    surrounding_context = "\n".join(context_lines)

    pace = trip.preferences.get("pace", "balanced") if trip.preferences else "balanced"

    new_day = groq_service.regenerate_day(
        destination=trip.destination,
        country=trip.country,
        day_number=req.day_number,
        date_str=current_day.date,
        current_day=current_day,
        surrounding_context=surrounding_context,
        user_instructions=req.user_instructions,
        currency=trip.currency,
        pace=pace,
    )

    updated_itinerary = itinerary_service.replace_day(itinerary, req.day_number, new_day)

    return trip_service.update_trip(
        trip_id=trip_id,
        user_id=current_user.id,
        updates={"itinerary": updated_itinerary.model_dump()},
        token=token,
    )


@router.post("/regenerate-all", response_model=TripResponse)
def regenerate_entire_itinerary(
    trip_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
):
    """
    Regenerates the complete itinerary from scratch using the stored trip preferences.
    """
    token = credentials.credentials if credentials else None
    trip = trip_service.get_trip(trip_id, current_user.id, token)

    s_date = date.fromisoformat(trip.start_date)
    e_date = date.fromisoformat(trip.end_date)
    duration_days = (e_date - s_date).days + 1

    create_req = TripCreateRequest(
        destination=trip.destination,
        country=trip.country,
        start_date=trip.start_date,
        end_date=trip.end_date,
        adults=trip.travelers,
        children=0,
        total_budget=trip.budget,
        currency=trip.currency,
        preferences=trip.preferences or {},
    )

    new_itinerary = groq_service.generate_itinerary(create_req, duration_days)

    return trip_service.update_trip(
        trip_id=trip_id,
        user_id=current_user.id,
        updates={"title": new_itinerary.title, "itinerary": new_itinerary.model_dump()},
        token=token,
    )


@router.post("/activities", response_model=TripResponse)
def add_activity(
    trip_id: uuid.UUID,
    req: ActivityCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
):
    """
    Adds a new custom activity to a specified day.
    """
    token = credentials.credentials if credentials else None
    trip = trip_service.get_trip(trip_id, current_user.id, token)
    if not trip.itinerary:
        raise HTTPException(status_code=400, detail="Trip has no generated itinerary.")

    itinerary = Itinerary.model_validate(trip.itinerary)
    updated_itinerary = itinerary_service.add_activity(itinerary, req.day_number, req.activity)

    return trip_service.update_trip(
        trip_id=trip_id,
        user_id=current_user.id,
        updates={"itinerary": updated_itinerary.model_dump()},
        token=token,
    )


@router.put("/activities/{activity_id}", response_model=TripResponse)
def update_activity(
    trip_id: uuid.UUID,
    activity_id: str,
    day_number: int,
    updates: Activity,
    current_user: AuthenticatedUser = Depends(get_current_user),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
):
    """
    Updates an existing activity's details, time slot, or cost.
    """
    token = credentials.credentials if credentials else None
    trip = trip_service.get_trip(trip_id, current_user.id, token)
    if not trip.itinerary:
        raise HTTPException(status_code=400, detail="Trip has no generated itinerary.")

    itinerary = Itinerary.model_validate(trip.itinerary)
    updated_itinerary = itinerary_service.update_activity(
        itinerary, day_number, activity_id, updates
    )

    return trip_service.update_trip(
        trip_id=trip_id,
        user_id=current_user.id,
        updates={"itinerary": updated_itinerary.model_dump()},
        token=token,
    )


@router.delete("/activities/{activity_id}", response_model=TripResponse)
def delete_activity(
    trip_id: uuid.UUID,
    activity_id: str,
    day_number: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
):
    """
    Deletes an activity from a day and recalculates the budget.
    """
    token = credentials.credentials if credentials else None
    trip = trip_service.get_trip(trip_id, current_user.id, token)
    if not trip.itinerary:
        raise HTTPException(status_code=400, detail="Trip has no generated itinerary.")

    itinerary = Itinerary.model_validate(trip.itinerary)
    updated_itinerary = itinerary_service.delete_activity(itinerary, day_number, activity_id)

    return trip_service.update_trip(
        trip_id=trip_id,
        user_id=current_user.id,
        updates={"itinerary": updated_itinerary.model_dump()},
        token=token,
    )


@router.post("/activities/reorder", response_model=TripResponse)
def reorder_activities(
    trip_id: uuid.UUID,
    req: ActivityReorderRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
):
    """
    Reorders activities in a day based on a list of activity IDs.
    """
    token = credentials.credentials if credentials else None
    trip = trip_service.get_trip(trip_id, current_user.id, token)
    if not trip.itinerary:
        raise HTTPException(status_code=400, detail="Trip has no generated itinerary.")

    itinerary = Itinerary.model_validate(trip.itinerary)
    updated_itinerary = itinerary_service.reorder_activities(
        itinerary, req.day_number, req.activity_ids
    )

    return trip_service.update_trip(
        trip_id=trip_id,
        user_id=current_user.id,
        updates={"itinerary": updated_itinerary.model_dump()},
        token=token,
    )
