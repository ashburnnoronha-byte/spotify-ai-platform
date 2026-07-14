from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.auth.token_manager import TokenRefreshError
from app.database.redis import get_redis
from app.database.session import get_db
from app.models.user import User
from app.schemas.analytics import AnalyticsDashboard
from app.services.analytics_service import AnalyticsService
from app.utils.exceptions import SpotifyAPIError

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=AnalyticsDashboard)
async def get_analytics_dashboard(
    time_range: str = Query("medium_term", pattern="^(short_term|medium_term|long_term)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AnalyticsDashboard:
    cache_key = f"analytics:{current_user.id}:{time_range}"
    try:
        redis = await get_redis()
        cached = await redis.get(cache_key)
        if cached:
            return AnalyticsDashboard.model_validate_json(cached)
    except Exception:
        redis = None

    service = AnalyticsService(db, current_user)
    try:
        result = await service.get_dashboard(time_range)
        if redis:
            await redis.setex(cache_key, 900, result.model_dump_json())
        return result
    except TokenRefreshError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from e
    except SpotifyAPIError as e:
        if e.status_code == 429:
            if redis:
                stale = await redis.get(cache_key)
                if stale:
                    return AnalyticsDashboard.model_validate_json(stale)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Spotify rate limit reached. Please wait a moment and try again.",
            ) from e
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Spotify API error: {e.detail}",
        ) from e
