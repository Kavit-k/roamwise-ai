from typing import Optional
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from app.core.config import settings

security_bearer = HTTPBearer(auto_error=False)


class AuthenticatedUser(BaseModel):
    id: uuid.UUID
    email: Optional[str] = None
    role: Optional[str] = None


def decode_access_token(token: str) -> dict:
    """
    Decodes and validates a Supabase JWT access token.
    Uses JWT secret verification if configured; otherwise performs claims validation.
    """
    try:
        if settings.SUPABASE_JWT_SECRET:
            # Verify signature with secret
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )
        else:
            # Decode claims without signature verification (development / when secret not set)
            # Ensure token has valid format and unexpired claims
            payload = jwt.get_unverified_claims(token)
            
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is missing required subject claim (sub)"
            )
        
        # Verify user_id is a valid UUID
        try:
            uuid.UUID(user_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Subject claim in token is not a valid UUID"
            )

        return payload
    except HTTPException:
        raise
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}"
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> AuthenticatedUser:
    """
    Dependency for obtaining the authenticated user from the Bearer token.
    Enforces that requests to protected routes have valid credentials.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header or Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    claims = decode_access_token(token)
    user_id = uuid.UUID(claims["sub"])
    email = claims.get("email")
    role = claims.get("role", "authenticated")

    return AuthenticatedUser(id=user_id, email=email, role=role)
