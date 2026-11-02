import uuid
import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.trip import TripCreateRequest, TripPreferences
from app.schemas.itinerary import (
    Itinerary,
    DayPlan,
    Activity,
    BudgetBreakdown,
    AccommodationSuggestion,
    TravelGuidance,
    MealSuggestions,
)

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
OTHER_USER_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")


@pytest.fixture
def mock_current_user():
    return AuthenticatedUser(
        id=TEST_USER_ID,
        email="testuser@roamwise.ai",
        role="authenticated"
    )


@pytest.fixture
def other_user():
    return AuthenticatedUser(
        id=OTHER_USER_ID,
        email="otheruser@roamwise.ai",
        role="authenticated"
    )


@pytest.fixture
def client(mock_current_user):
    app.dependency_overrides[get_current_user] = lambda: mock_current_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def sample_trip_request():
    today = date.today() + timedelta(days=30)
    end = today + timedelta(days=4)
    return TripCreateRequest(
        destination="Kyoto",
        country="Japan",
        start_date=today.isoformat(),
        end_date=end.isoformat(),
        adults=2,
        children=0,
        travel_type="couple",
        total_budget=3000.0,
        currency="USD",
        preferences=TripPreferences(
            interests=["culture", "temples", "food"],
            pace="balanced",
            transport_preference="public_transit",
            accommodation_type="mid-range",
            budget_tier="moderate"
        )
    )


@pytest.fixture
def sample_itinerary(sample_trip_request):
    days = []
    start = date.fromisoformat(sample_trip_request.start_date)
    for i in range(5):
        d_date = (start + timedelta(days=i)).isoformat()
        days.append(
            DayPlan(
                day_number=i + 1,
                date=d_date,
                theme=f"Exploring Kyoto Sector {i+1}",
                morning=[
                    Activity(
                        id=f"act-m-{i+1}",
                        title=f"Historic Temple Visit {i+1}",
                        time_slot="morning",
                        start_time="09:00 AM",
                        duration_mins=90,
                        description="Morning meditation and stroll through temple gardens.",
                        estimated_cost=15.0,
                        category="culture",
                        location_hint="Higashiyama",
                        practical_tips="Arrive early to beat crowds."
                    )
                ],
                afternoon=[
                    Activity(
                        id=f"act-a-{i+1}",
                        title=f"Traditional Market Walk {i+1}",
                        time_slot="afternoon",
                        start_time="01:30 PM",
                        duration_mins=120,
                        description="Sampling matcha pastries and local specialties.",
                        estimated_cost=25.0,
                        category="food",
                        location_hint="Nishiki Market"
                    )
                ],
                evening=[
                    Activity(
                        id=f"act-e-{i+1}",
                        title=f"Gion Evening Lantern Walk {i+1}",
                        time_slot="evening",
                        start_time="06:30 PM",
                        duration_mins=75,
                        description="Evening atmosphere in the lantern-lit wooden district.",
                        estimated_cost=0.0,
                        category="sightseeing",
                        location_hint="Gion"
                    )
                ],
                meals=MealSuggestions(
                    breakfast="Matcha roll at bakery",
                    lunch="Soba noodles near temple",
                    dinner="Kaiseki set in Gion"
                ),
                transport_advice="Take Kyoto City Bus #206 or Hankyu line.",
                practical_notes="Carry cash for small vendors."
            )
        )

    return Itinerary(
        title="Kyoto Zen & Heritage: 5-Day Cultural Odyssey",
        destination="Kyoto",
        country="Japan",
        start_date=sample_trip_request.start_date,
        end_date=sample_trip_request.end_date,
        days_count=5,
        travelers=2,
        travel_type="couple",
        summary="A serene exploration of Japan's historic capital balancing sacred temples, tea culture, and lantern-lit alleyways.",
        budget_breakdown=BudgetBreakdown(
            accommodation=900.0,
            food=600.0,
            transportation=150.0,
            activities=200.0,
            miscellaneous=150.0,
            estimated_total=2000.0,
            currency="USD",
            user_budget=3000.0,
            is_within_budget=True,
            budget_difference=1000.0,
            budget_notes="Comfortably within target budget with a $1,000 contingency buffer."
        ),
        days=days,
        accommodations=[
            AccommodationSuggestion(
                area_name="Gion / Higashiyama",
                category="Traditional Ryokan or Boutique Hotel",
                reason="Walking distance to major sights and serene morning walks.",
                estimated_nightly_price=180.0,
                currency="USD",
                booking_tips="Book 2 months in advance for autumn foliage season."
            )
        ],
        guidance=TravelGuidance(
            packing_list=["Slip-on shoes for temples", "Pocket Wi-Fi / eSIM", "Modest clothing"],
            local_transport="ICOCA card covers Kyoto buses and subway lines seamlessly.",
            safety_tips=["Japan has exceptionally low crime rates; keep IC card charged."],
            important_reminders=["No smoking on Kyoto public streets except designated spots."]
        )
    )
