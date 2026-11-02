import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import HTTPException, status
from app.db.supabase import get_authenticated_supabase_client, get_supabase_client
from app.schemas.trip import TripCreateRequest, TripUpdateRequest, TripResponse
from app.schemas.itinerary import Itinerary
import logging

logger = logging.getLogger(__name__)


class TripService:
    def _get_client_or_error(self, token: Optional[str] = None):
        """
        Retrieves an authenticated Supabase client using the user's JWT token
        to enforce PostgreSQL Row Level Security (RLS).
        Falls back to the general client or raises 503 if credentials are missing.
        """
        client = None
        if token:
            client = get_authenticated_supabase_client(token)
        if not client:
            client = get_supabase_client()

        if not client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Supabase database is not configured. Please supply SUPABASE_URL and SUPABASE_KEY in .env."
            )
        return client

    def create_trip(
        self,
        user_id: uuid.UUID,
        req: TripCreateRequest,
        itinerary: Itinerary,
        token: Optional[str] = None,
    ) -> TripResponse:
        client = self._get_client_or_error(token)
        trip_id = uuid.uuid4()
        now_str = datetime.utcnow().isoformat()

        row_data = {
            "id": str(trip_id),
            "user_id": str(user_id),
            "title": itinerary.title,
            "destination": req.destination,
            "country": req.country,
            "start_date": req.start_date,
            "end_date": req.end_date,
            "travelers": req.adults + req.children,
            "budget": float(req.total_budget),
            "currency": req.currency,
            "preferences": req.preferences.model_dump(),
            "itinerary": itinerary.model_dump(),
            "status": "planned",
            "created_at": now_str,
            "updated_at": now_str,
        }

        try:
            res = client.table("trips").insert(row_data).execute()
            if not res.data or len(res.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database failed to persist trip record."
                )
            record = res.data[0]
            return TripResponse(**record)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating trip in Supabase: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error while creating trip: {str(e)}"
            )

    def list_trips(self, user_id: uuid.UUID, token: Optional[str] = None) -> List[TripResponse]:
        client = self._get_client_or_error(token)
        try:
            res = (
                client.table("trips")
                .select("*")
                .eq("user_id", str(user_id))
                .order("created_at", desc=True)
                .execute()
            )
            return [TripResponse(**item) for item in (res.data or [])]
        except Exception as e:
            logger.error(f"Error fetching trips from Supabase: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error fetching trips: {str(e)}"
            )

    def get_trip(
        self, trip_id: uuid.UUID, user_id: uuid.UUID, token: Optional[str] = None
    ) -> TripResponse:
        client = self._get_client_or_error(token)
        try:
            res = (
                client.table("trips")
                .select("*")
                .eq("id", str(trip_id))
                .execute()
            )
            if not res.data or len(res.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Trip not found."
                )

            record = res.data[0]
            # Strict cross-user isolation verification
            if record.get("user_id") != str(user_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this trip."
                )

            return TripResponse(**record)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error retrieving trip {trip_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error retrieving trip: {str(e)}"
            )

    def update_trip(
        self,
        trip_id: uuid.UUID,
        user_id: uuid.UUID,
        updates: Dict[str, Any],
        token: Optional[str] = None,
    ) -> TripResponse:
        # First check ownership
        _ = self.get_trip(trip_id, user_id, token)

        client = self._get_client_or_error(token)
        updates["updated_at"] = datetime.utcnow().isoformat()

        try:
            res = (
                client.table("trips")
                .update(updates)
                .eq("id", str(trip_id))
                .eq("user_id", str(user_id))
                .execute()
            )
            if not res.data or len(res.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Trip could not be updated or was not found."
                )
            return TripResponse(**res.data[0])
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating trip {trip_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error updating trip: {str(e)}"
            )

    def delete_trip(
        self, trip_id: uuid.UUID, user_id: uuid.UUID, token: Optional[str] = None
    ) -> bool:
        # Check ownership
        _ = self.get_trip(trip_id, user_id, token)

        client = self._get_client_or_error(token)
        try:
            res = (
                client.table("trips")
                .delete()
                .eq("id", str(trip_id))
                .eq("user_id", str(user_id))
                .execute()
            )
            return True
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting trip {trip_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error deleting trip: {str(e)}"
            )


trip_service = TripService()
