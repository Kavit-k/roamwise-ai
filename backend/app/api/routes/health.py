from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
def health_check():
    """
    Health check endpoint reporting service operational status
    and availability of external credentials (Groq, Supabase).
    """
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "groq_configured": bool(settings.GROQ_API_KEY),
        "groq_model": settings.GROQ_MODEL,
        "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_KEY),
    }
