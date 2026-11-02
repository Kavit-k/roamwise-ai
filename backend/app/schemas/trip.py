from typing import List, Optional, Any, Dict
import uuid
from datetime import date
from pydantic import BaseModel, Field, field_validator, model_validator
from app.schemas.itinerary import Itinerary, DayPlan, Activity


class TripPreferences(BaseModel):
    interests: List[str] = Field(default_factory=lambda: ["sightseeing", "culture", "food"], description="Traveler interests")
    pace: str = Field(default="balanced", pattern="^(relaxed|balanced|packed)$", description="Travel pace")
    transport_preference: Optional[str] = Field(default="public_transit", description="public_transit, walking, rental_car, taxi")
    accommodation_type: Optional[str] = Field(default="mid-range", description="budget, mid-range, boutique, luxury")
    dietary_requirements: Optional[str] = Field(default=None, description="e.g. Vegetarian, Halal, Gluten-Free, None")
    accessibility_requirements: Optional[str] = Field(default=None, description="e.g. Wheelchair accessible, low walking")
    additional_notes: Optional[str] = Field(default=None, description="Special traveler requests or constraints")
    budget_tier: str = Field(default="moderate", pattern="^(budget|moderate|luxury)$", description="Budget category")


class TripCreateRequest(BaseModel):
    destination: str = Field(..., min_length=2, max_length=150, description="City or region name")
    country: str = Field(..., min_length=2, max_length=100, description="Country name")
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Start date (YYYY-MM-DD)")
    end_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="End date (YYYY-MM-DD)")
    adults: int = Field(default=1, ge=1, le=20, description="Number of adults")
    children: int = Field(default=0, ge=0, le=15, description="Number of children")
    travel_type: str = Field(default="solo", pattern="^(solo|couple|family|friends|business)$", description="Party travel style")
    total_budget: float = Field(..., gt=0, description="Total planned budget")
    currency: str = Field(default="USD", min_length=3, max_length=5, description="Currency e.g. USD, EUR, GBP")
    preferences: TripPreferences = Field(default_factory=TripPreferences, description="Travel preferences")

    @model_validator(mode="after")
    def validate_dates_and_duration(self):
        try:
            s_date = date.fromisoformat(self.start_date)
            e_date = date.fromisoformat(self.end_date)
        except ValueError:
            raise ValueError("Dates must be valid ISO format (YYYY-MM-DD)")
        
        if e_date < s_date:
            raise ValueError("End date cannot be earlier than start date")
        
        duration = (e_date - s_date).days + 1
        if duration > 30:
            raise ValueError("Trip duration cannot exceed 30 days for optimal itinerary generation")
        return self


class TripUpdateRequest(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = Field(default=None, pattern="^(planned|in_progress|completed|archived)$")
    preferences: Optional[TripPreferences] = None
    itinerary: Optional[Itinerary] = None


class DayRegenerateRequest(BaseModel):
    day_number: int = Field(..., ge=1, description="Day number to regenerate")
    user_instructions: Optional[str] = Field(default=None, max_length=500, description="Optional custom guidelines for regeneration")


class ActivityCreateRequest(BaseModel):
    day_number: int = Field(..., ge=1)
    activity: Activity


class ActivityUpdateRequest(BaseModel):
    day_number: int = Field(..., ge=1)
    activity_id: str
    updates: Activity


class ActivityDeleteRequest(BaseModel):
    day_number: int = Field(..., ge=1)
    activity_id: str


class ActivityReorderRequest(BaseModel):
    day_number: int = Field(..., ge=1)
    activity_ids: List[str] = Field(..., min_length=1, description="Ordered list of activity IDs for this day")


class TripResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    destination: str
    country: str
    start_date: str
    end_date: str
    travelers: int
    budget: float
    currency: str
    preferences: Dict[str, Any]
    itinerary: Optional[Dict[str, Any]] = None
    status: str
    created_at: str
    updated_at: str
