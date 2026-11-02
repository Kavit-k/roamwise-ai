import pytest
from pydantic import ValidationError
from app.schemas.trip import TripCreateRequest, TripPreferences
from app.schemas.itinerary import Activity, DayPlan


def test_trip_request_valid_dates(sample_trip_request):
    assert sample_trip_request.destination == "Kyoto"
    assert sample_trip_request.adults == 2
    assert sample_trip_request.total_budget == 3000.0


def test_trip_request_invalid_dates_order():
    with pytest.raises(ValidationError) as exc:
        TripCreateRequest(
            destination="Rome",
            country="Italy",
            start_date="2026-06-10",
            end_date="2026-06-05",  # Earlier than start date
            total_budget=2000.0,
            preferences=TripPreferences()
        )
    assert "End date cannot be earlier than start date" in str(exc.value)


def test_trip_request_exceeds_max_duration():
    with pytest.raises(ValidationError) as exc:
        TripCreateRequest(
            destination="Paris",
            country="France",
            start_date="2026-07-01",
            end_date="2026-08-15",  # 46 days > 30 days
            total_budget=5000.0,
            preferences=TripPreferences()
        )
    assert "duration cannot exceed 30 days" in str(exc.value)


def test_trip_request_invalid_budget():
    with pytest.raises(ValidationError):
        TripCreateRequest(
            destination="Berlin",
            country="Germany",
            start_date="2026-09-01",
            end_date="2026-09-05",
            total_budget=-500.0,  # Negative budget
            preferences=TripPreferences()
        )


def test_activity_invalid_time_slot():
    with pytest.raises(ValidationError):
        Activity(
            title="Night club",
            time_slot="midnight",  # Invalid, must be morning/afternoon/evening
            description="Dancing"
        )
