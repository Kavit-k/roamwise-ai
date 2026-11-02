from typing import List, Optional, Dict
from pydantic import BaseModel, Field
import uuid


class Activity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique activity identifier")
    title: str = Field(..., min_length=1, max_length=200, description="Activity title")
    time_slot: str = Field(..., pattern="^(morning|afternoon|evening)$", description="morning, afternoon, or evening")
    start_time: Optional[str] = Field(default=None, description="Suggested start time e.g. '09:30 AM'")
    duration_mins: Optional[int] = Field(default=60, ge=15, le=720, description="Estimated duration in minutes")
    description: str = Field(..., min_length=1, description="Concise description of the activity")
    estimated_cost: float = Field(default=0.0, ge=0.0, description="Estimated activity cost per person or group")
    category: Optional[str] = Field(default="sightseeing", description="Category e.g. sightseeing, food, nature, culture")
    location_hint: Optional[str] = Field(default=None, description="Neighborhood, district, or area")
    practical_tips: Optional[str] = Field(default=None, description="Important tip or reservation advice")


class MealSuggestions(BaseModel):
    breakfast: Optional[str] = Field(default=None, description="Breakfast recommendation or neighborhood")
    lunch: Optional[str] = Field(default=None, description="Lunch recommendation or cuisine type")
    dinner: Optional[str] = Field(default=None, description="Dinner recommendation or atmosphere")


class DayPlan(BaseModel):
    day_number: int = Field(..., ge=1, description="Day number of the trip (1-indexed)")
    date: str = Field(..., description="Date for this day in YYYY-MM-DD format")
    theme: str = Field(..., description="Highlight or theme for the day")
    morning: List[Activity] = Field(default_factory=list, description="Morning activities")
    afternoon: List[Activity] = Field(default_factory=list, description="Afternoon activities")
    evening: List[Activity] = Field(default_factory=list, description="Evening activities")
    meals: Optional[MealSuggestions] = Field(default_factory=MealSuggestions, description="Meal suggestions")
    transport_advice: Optional[str] = Field(default=None, description="Advice for getting around today")
    practical_notes: Optional[str] = Field(default=None, description="Key tips or closing days to be aware of")
    alternatives: Optional[List[str]] = Field(default_factory=list, description="Alternative options for bad weather or low energy")

    def all_activities(self) -> List[Activity]:
        return self.morning + self.afternoon + self.evening


class AccommodationSuggestion(BaseModel):
    area_name: str = Field(..., description="Suggested neighborhood or area")
    category: str = Field(..., description="Category: Boutique, Budget, Mid-range, Luxury, or Apartment")
    reason: str = Field(..., description="Why this area is ideal for the itinerary")
    estimated_nightly_price: float = Field(default=0.0, ge=0.0, description="Estimated nightly rate")
    currency: str = Field(default="USD", description="Currency symbol or code")
    booking_tips: str = Field(..., description="Booking advice and considerations")


class BudgetBreakdown(BaseModel):
    accommodation: float = Field(default=0.0, ge=0.0, description="Total estimated accommodation cost")
    food: float = Field(default=0.0, ge=0.0, description="Total estimated food & dining cost")
    transportation: float = Field(default=0.0, ge=0.0, description="Total estimated local transportation cost")
    activities: float = Field(default=0.0, ge=0.0, description="Total estimated activities and entrance fees")
    miscellaneous: float = Field(default=0.0, ge=0.0, description="Buffer and miscellaneous expenses")
    estimated_total: float = Field(default=0.0, ge=0.0, description="Sum of all estimated categories")
    currency: str = Field(default="USD", description="Currency code")
    user_budget: float = Field(default=0.0, ge=0.0, description="Target budget provided by traveler")
    is_within_budget: bool = Field(default=True, description="Whether estimated total <= user_budget")
    budget_difference: float = Field(default=0.0, description="Difference (user_budget - estimated_total)")
    budget_notes: Optional[str] = Field(default=None, description="Explanation if budget is exceeded or savings tips")


class TravelGuidance(BaseModel):
    packing_list: List[str] = Field(default_factory=list, description="Key packing recommendations for the climate/activities")
    local_transport: str = Field(..., description="General public transit or taxi advice")
    safety_tips: List[str] = Field(default_factory=list, description="General health and safety considerations")
    important_reminders: List[str] = Field(default_factory=list, description="Visa, currency exchange, cultural etiquette")
    unverified_details_disclaimer: str = Field(
        default="All costs, operating hours, and neighborhood suggestions are AI-generated estimates and subject to change. Please verify opening hours and prices before visiting.",
        description="Factual limitations disclaimer"
    )


class Itinerary(BaseModel):
    title: str = Field(..., description="Engaging title for the journey")
    destination: str = Field(..., description="Target city or region")
    country: str = Field(..., description="Country")
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format")
    days_count: int = Field(..., ge=1, description="Total days")
    travelers: int = Field(..., ge=1, description="Number of travelers")
    travel_type: str = Field(default="solo", description="Travel type: solo, couple, family, friends, business")
    summary: str = Field(..., description="Executive summary of the trip")
    budget_breakdown: BudgetBreakdown = Field(..., description="Comprehensive calculated budget")
    days: List[DayPlan] = Field(..., description="Day-by-day plans")
    accommodations: List[AccommodationSuggestion] = Field(default_factory=list, description="Accommodation suggestions")
    guidance: TravelGuidance = Field(..., description="Practical travel guidance")
    disclaimer: str = Field(
        default="Roamwise AI generated this itinerary based on historical information. Costs, availability, and opening hours require verification prior to booking.",
        description="Prominent factual limitation disclaimer"
    )
