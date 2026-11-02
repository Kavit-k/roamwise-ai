import json
from unittest.mock import MagicMock, patch
import pytest
from fastapi import HTTPException
from groq import RateLimitError
from app.services.groq_service import GroqService


def test_groq_service_generate_success(sample_trip_request, sample_itinerary):
    service = GroqService()
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = sample_itinerary.model_dump_json()
    mock_response.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_response

    service.client = mock_client
    result = service.generate_itinerary(sample_trip_request, 5)

    assert result.destination == "Kyoto"
    assert result.days_count == 5
    assert len(result.days) == 5
    assert mock_client.chat.completions.create.call_count == 1


def test_groq_service_retry_on_malformed_json(sample_trip_request, sample_itinerary):
    service = GroqService()
    mock_client = MagicMock()

    # First attempt returns invalid JSON string, second returns valid JSON
    bad_choice = MagicMock()
    bad_choice.message.content = "INVALID_JSON_DATA"
    bad_resp = MagicMock()
    bad_resp.choices = [bad_choice]

    good_choice = MagicMock()
    good_choice.message.content = sample_itinerary.model_dump_json()
    good_resp = MagicMock()
    good_resp.choices = [good_choice]

    mock_client.chat.completions.create.side_effect = [bad_resp, good_resp]
    service.client = mock_client

    result = service.generate_itinerary(sample_trip_request, 5)
    assert result.destination == "Kyoto"
    # Should have retried and succeeded on attempt 2
    assert mock_client.chat.completions.create.call_count == 2


def test_groq_service_rate_limit(sample_trip_request):
    service = GroqService()
    mock_client = MagicMock()
    
    # Simulate RateLimitError
    err_response = MagicMock()
    err_response.status_code = 429
    mock_client.chat.completions.create.side_effect = RateLimitError(
        message="Rate limit reached",
        response=err_response,
        body=None
    )
    service.client = mock_client

    with pytest.raises(HTTPException) as exc:
        service.generate_itinerary(sample_trip_request, 5)
    assert exc.value.status_code == 429
    assert "rate limit exceeded" in exc.value.detail.lower()
