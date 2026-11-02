import json
import logging
from typing import Optional, Dict, Any, List
from groq import Groq, GroqError, RateLimitError, APITimeoutError
from fastapi import HTTPException, status
from app.core.config import settings
from app.schemas.trip import TripCreateRequest
from app.schemas.itinerary import Itinerary, DayPlan

logger = logging.getLogger(__name__)


class GroqService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.client: Optional[Groq] = None
        if self.api_key:
            self.client = Groq(api_key=self.api_key, timeout=settings.GROQ_TIMEOUT_SECONDS)

    def _get_client(self) -> Groq:
        if not self.client:
            if not settings.GROQ_API_KEY:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="GROQ_API_KEY is not configured on the backend server. Please configure it in .env."
                )
            self.client = Groq(api_key=settings.GROQ_API_KEY, timeout=settings.GROQ_TIMEOUT_SECONDS)
        return self.client

    def _build_itinerary_prompt(self, req: TripCreateRequest, duration_days: int) -> str:
        interests_str = ", ".join(req.preferences.interests)
        return f"""You are Roamwise AI, an expert, budget-conscious travel planner.
Generate a comprehensive, realistic, and highly practical {duration_days}-day travel itinerary for:
- Destination: {req.destination}, {req.country}
- Dates: {req.start_date} to {req.end_date} ({duration_days} days)
- Travelers: {req.adults} adult(s), {req.children} child(ren) (Travel Style: {req.travel_type})
- Target Budget: {req.total_budget:,.2f} {req.currency} (Budget Tier: {req.preferences.budget_tier})
- Traveler Interests: {interests_str}
- Pace: {req.preferences.pace}
- Transport Preference: {req.preferences.transport_preference or 'public transit'}
- Dietary Needs: {req.preferences.dietary_requirements or 'None'}
- Accessibility: {req.preferences.accessibility_requirements or 'Standard'}
- Special Instructions: {req.preferences.additional_notes or 'None'}

CRITICAL FACTUAL RULES & LIMITATIONS:
1. All costs, opening hours, and neighborhood suggestions are unverified estimates and must be clearly treated as such.
2. DO NOT invent fake URLs, confirmed hotel booking codes, or claim real-time attraction availability.
3. Keep the budget breakdown internally consistent: estimated_total MUST equal the sum of (accommodation + food + transportation + activities + miscellaneous).
4. For each day, include distinct morning, afternoon, and evening activities with realistic time slots, durations, estimated costs in {req.currency}, and practical tips.
5. Provide 2-3 neighborhood accommodation recommendations (not specific booked hotels) with estimated nightly rates.
6. Provide essential practical guidance including packing essentials, local transit etiquette, and safety considerations.

You MUST respond strictly with valid JSON conforming to this schema (no markdown, no backticks, only valid JSON):
{{
  "title": "{req.destination} Adventure: A Curated {duration_days}-Day Journey",
  "destination": "{req.destination}",
  "country": "{req.country}",
  "start_date": "{req.start_date}",
  "end_date": "{req.end_date}",
  "days_count": {duration_days},
  "travelers": {req.adults + req.children},
  "travel_type": "{req.travel_type}",
  "summary": "Concise 2-3 paragraph overview of what makes this trip memorable and realistic for the budget.",
  "budget_breakdown": {{
    "accommodation": 0.0,
    "food": 0.0,
    "transportation": 0.0,
    "activities": 0.0,
    "miscellaneous": 0.0,
    "estimated_total": 0.0,
    "currency": "{req.currency}",
    "user_budget": {req.total_budget},
    "is_within_budget": true,
    "budget_difference": 0.0,
    "budget_notes": "Explanation of financial feasibility and practical savings advice."
  }},
  "days": [
    {{
      "day_number": 1,
      "date": "{req.start_date}",
      "theme": "Arrival & City Orientation",
      "morning": [
        {{
          "id": "day1-act1",
          "title": "Sample Activity",
          "time_slot": "morning",
          "start_time": "09:30 AM",
          "duration_mins": 90,
          "description": "Engaging description with practical context.",
          "estimated_cost": 15.0,
          "category": "sightseeing",
          "location_hint": "Historic Center",
          "practical_tips": "Pre-booking recommended during peak season."
        }}
      ],
      "afternoon": [],
      "evening": [],
      "meals": {{
        "breakfast": "Local bakery in neighborhood",
        "lunch": "Casual bistro suggestion",
        "dinner": "Authentic regional restaurant"
      }},
      "transport_advice": "Walkable district; metro pass recommended.",
      "practical_notes": "Comfortable footwear advised.",
      "alternatives": ["Alternative indoor gallery if raining"]
    }}
  ],
  "accommodations": [
    {{
      "area_name": "Neighborhood Name",
      "category": "Mid-range Hotel",
      "reason": "Why this area fits the traveler's pace and budget",
      "estimated_nightly_price": 120.0,
      "currency": "{req.currency}",
      "booking_tips": "Reserve 4-6 weeks ahead for best rates."
    }}
  ],
  "guidance": {{
    "packing_list": ["Comfortable shoes", "Adapter plug", "Light jacket"],
    "local_transport": "Public transit overview and ticketing advice.",
    "safety_tips": ["Keep emergency numbers handy", "Watch for pickpockets in crowded transit hubs"],
    "important_reminders": ["Validate transit tickets before boarding", "Verify museum opening hours ahead"],
    "unverified_details_disclaimer": "All costs and recommendations are AI-generated estimates. Confirm current hours, entry requirements, and prices before visiting."
  }},
  "disclaimer": "Roamwise AI generated this itinerary using AI estimates. Prices, transit routes, and hours should be independently verified before travel."
}}"""

    def generate_itinerary(self, req: TripCreateRequest, duration_days: int) -> Itinerary:
        client = self._get_client()
        prompt = self._build_itinerary_prompt(req, duration_days)
        last_error = None

        for attempt in range(settings.GROQ_MAX_RETRIES + 1):
            try:
                logger.info(f"Invoking Groq model '{self.model}', attempt {attempt + 1}")
                response = client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a professional travel planner API backend. "
                                "You MUST output only valid, parseable JSON matching the requested structure. "
                                "Never output markdown formatting, preamble, or commentary."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3,
                    max_tokens=6000,
                )

                content = response.choices[0].message.content
                if not content:
                    raise ValueError("Groq returned an empty response")

                parsed_json = json.loads(content)
                itinerary = Itinerary.model_validate(parsed_json)
                
                # Enforce calculation consistency
                self._recalculate_budget(itinerary, req.total_budget, req.currency)
                return itinerary

            except RateLimitError as e:
                logger.error(f"Groq Rate Limit Exceeded: {e}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Groq AI rate limit exceeded. Please wait a moment before retrying."
                )
            except APITimeoutError as e:
                logger.error(f"Groq API Timeout: {e}")
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="The AI itinerary generator timed out. Please try again."
                )
            except json.JSONDecodeError as e:
                logger.warning(f"Groq output was invalid JSON on attempt {attempt + 1}: {e}")
                last_error = e
                # Adjust prompt for retry
                prompt += "\n\nCRITICAL FIX: Your previous response contained invalid JSON. Return ONLY raw valid JSON."
            except Exception as e:
                logger.warning(f"Validation or generation error on attempt {attempt + 1}: {e}")
                last_error = e

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate structured itinerary after {settings.GROQ_MAX_RETRIES + 1} attempts. Error: {str(last_error)}"
        )

    def regenerate_day(
        self,
        destination: str,
        country: str,
        day_number: int,
        date_str: str,
        current_day: DayPlan,
        surrounding_context: str,
        user_instructions: Optional[str],
        currency: str,
        pace: str
    ) -> DayPlan:
        client = self._get_client()
        prompt = f"""You are Roamwise AI. Regenerate the itinerary for Day {day_number} ({date_str}) in {destination}, {country}.
Travel pace: {pace}
Currency: {currency}

Surrounding Trip Context:
{surrounding_context}

Previous Plan for this day:
Theme: {current_day.theme}
Activities: {[act.title for act in current_day.all_activities()]}

Traveler Modification Instructions:
{user_instructions or 'Create fresh, exciting morning, afternoon, and evening activities suited to this day.'}

Provide a completely refreshed plan for Day {day_number} in valid JSON conforming to this schema:
{{
  "day_number": {day_number},
  "date": "{date_str}",
  "theme": "Fresh theme for this day",
  "morning": [
    {{
      "id": "day{day_number}-regen-m1",
      "title": "Title",
      "time_slot": "morning",
      "start_time": "09:00 AM",
      "duration_mins": 90,
      "description": "Details",
      "estimated_cost": 10.0,
      "category": "culture",
      "location_hint": "Area",
      "practical_tips": "Tips"
    }}
  ],
  "afternoon": [],
  "evening": [],
  "meals": {{
    "breakfast": "Recommendation",
    "lunch": "Recommendation",
    "dinner": "Recommendation"
  }},
  "transport_advice": "Transit tips",
  "practical_notes": "Notes",
  "alternatives": ["Bad weather backup"]
}}"""

        for attempt in range(settings.GROQ_MAX_RETRIES + 1):
            try:
                response = client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a professional travel planner backend. Output raw valid JSON only for the requested DayPlan schema.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.4,
                    max_tokens=2500,
                )
                content = response.choices[0].message.content
                parsed_json = json.loads(content)
                new_day = DayPlan.model_validate(parsed_json)
                new_day.day_number = day_number
                new_day.date = date_str
                return new_day
            except Exception as e:
                logger.warning(f"Error regenerating day on attempt {attempt + 1}: {e}")
                if attempt == settings.GROQ_MAX_RETRIES:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"Failed to regenerate Day {day_number}: {str(e)}"
                    )

    def _recalculate_budget(self, itinerary: Itinerary, user_budget: float, currency: str):
        """Ensures accurate sum of all activities and categories."""
        activity_sum = sum(
            act.estimated_cost
            for day in itinerary.days
            for act in day.all_activities()
        )
        b = itinerary.budget_breakdown
        b.activities = round(activity_sum, 2)
        b.estimated_total = round(
            b.accommodation + b.food + b.transportation + b.activities + b.miscellaneous, 2
        )
        b.user_budget = round(user_budget, 2)
        b.currency = currency
        b.is_within_budget = b.estimated_total <= b.user_budget
        b.budget_difference = round(b.user_budget - b.estimated_total, 2)
        if not b.is_within_budget:
            b.budget_notes = (
                f"The estimated total ({b.estimated_total:,.2f} {currency}) exceeds your planned budget "
                f"({user_budget:,.2f} {currency}) by {abs(b.budget_difference):,.2f} {currency}. "
                f"Consider adjusting accommodation or selecting free alternatives for some activities."
            )


groq_service = GroqService()
