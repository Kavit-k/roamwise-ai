from typing import Optional
from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Returns the singleton Supabase client initialized with server credentials.
    Returns None if SUPABASE_URL or SUPABASE_KEY are not configured.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        logger.warning(
            "Supabase credentials (SUPABASE_URL, SUPABASE_KEY) are not set. "
            "Database persistence will be unavailable until credentials are provided."
        )
        return None

    try:
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        return None


def get_authenticated_supabase_client(access_token: str) -> Optional[Client]:
    """
    Creates a Supabase client scoped to the authenticated user's JWT token,
    ensuring all database operations strictly enforce Row Level Security (RLS).
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return None

    try:
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        # Inject the user's bearer token into the client session / postgrest headers
        client.postgrest.auth(access_token)
        return client
    except Exception as e:
        logger.error(f"Error configuring authenticated Supabase client: {str(e)}")
        return None
