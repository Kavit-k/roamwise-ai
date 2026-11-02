import uuid
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.trip import TripResponse
from app.services.trip_service import trip_service

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
OTHER_USER_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")
SAMPLE_TRIP_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")


def test_unauthenticated_request_rejected():
    # Make request without dependency override or auth header
    app.dependency_overrides.clear()
    with TestClient(app) as anonymous_client:
        response = anonymous_client.get("/api/trips")
        assert response.status_code == 401


def test_list_trips_authenticated(client, sample_itinerary):
    mock_trip = TripResponse(
        id=SAMPLE_TRIP_ID,
        user_id=TEST_USER_ID,
        title="Kyoto Zen Trip",
        destination="Kyoto",
        country="Japan",
        start_date="2026-06-01",
        end_date="2026-06-05",
        travelers=2,
        budget=3000.0,
        currency="USD",
        preferences={},
        itinerary=sample_itinerary.model_dump(),
        status="planned",
        created_at="2026-11-01T12:00:00",
        updated_at="2026-11-01T12:00:00",
    )

    with patch.object(trip_service, "list_trips", return_value=[mock_trip]):
        response = client.get("/api/trips")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["destination"] == "Kyoto"


def test_cross_user_trip_access_denied(client, sample_itinerary):
    # Trip belongs to OTHER_USER_ID
    mock_trip_other = {
        "id": str(SAMPLE_TRIP_ID),
        "user_id": str(OTHER_USER_ID),
        "title": "Private Trip",
        "destination": "Paris",
        "country": "France",
        "start_date": "2026-07-01",
        "end_date": "2026-07-05",
        "travelers": 1,
        "budget": 2000.0,
        "currency": "EUR",
        "preferences": {},
        "itinerary": sample_itinerary.model_dump(),
        "status": "planned",
        "created_at": "2026-11-01T12:00:00",
        "updated_at": "2026-11-01T12:00:00",
    }

    mock_client = MagicMock()
    mock_table = MagicMock()
    mock_select = MagicMock()
    mock_eq = MagicMock()
    mock_res = MagicMock()
    mock_res.data = [mock_trip_other]

    mock_eq.execute.return_value = mock_res
    mock_select.eq.return_value = mock_eq
    mock_table.select.return_value = mock_select
    mock_client.table.return_value = mock_table

    with patch.object(trip_service, "_get_client_or_error", return_value=mock_client):
        # Client is authenticated as TEST_USER_ID
        response = client.get(f"/api/trips/{SAMPLE_TRIP_ID}")
        # Should be forbidden 403 because user does not own this trip
        assert response.status_code == 403
        assert "permission" in response.json()["detail"].lower()
