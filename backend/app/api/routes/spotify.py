import json
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.auth.token_manager import TokenRefreshError
from app.database.redis import get_redis
from app.database.session import get_db
from app.models.user import User
from app.schemas.spotify import SpotifyHomeResponse
from app.services.spotify_service import SpotifyService
from app.utils.exceptions import SpotifyAPIError

router = APIRouter(prefix="/spotify", tags=["spotify"])

CACHE_TTL_SECONDS = 900


def _get_service(db: AsyncSession, user: User) -> SpotifyService:
    return SpotifyService(db, user)


async def _handle_spotify_request(
    cache_key: str,
    fetch: Callable[[], Awaitable[dict[str, Any]]],
) -> dict[str, Any]:
    redis = None
    try:
        redis = await get_redis()
        cached = await redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        redis = None

    try:
        result = await fetch()
        if redis:
            await redis.setex(cache_key, CACHE_TTL_SECONDS, json.dumps(result))
        return result
    except TokenRefreshError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from e
    except SpotifyAPIError as e:
        if e.status_code == 429 and redis:
            stale = await redis.get(cache_key)
            if stale:
                return json.loads(stale)
        if e.status_code == 429:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Spotify rate limit reached. Please wait a moment and try again.",
            ) from e
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Spotify API error: {e.detail}",
        ) from e


@router.get("/home", response_model=SpotifyHomeResponse)
async def get_home(
    time_range: str = Query("medium_term", pattern="^(short_term|medium_term|long_term)$"),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    service = _get_service(db, current_user)
    cache_key = f"spotify:{current_user.id}:home:{time_range}:{limit}"
    return await _handle_spotify_request(
        cache_key,
        lambda: service.get_home_data(time_range, limit),
    )


@router.get("/top-artists")
async def get_top_artists(
    time_range: str = Query("medium_term", pattern="^(short_term|medium_term|long_term)$"),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    service = _get_service(db, current_user)
    cache_key = f"spotify:{current_user.id}:top-artists:{time_range}:{limit}"
    return await _handle_spotify_request(
        cache_key,
        lambda: service.get_top_artists(time_range, limit),
    )


@router.get("/top-tracks")
async def get_top_tracks(
    time_range: str = Query("medium_term", pattern="^(short_term|medium_term|long_term)$"),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    service = _get_service(db, current_user)
    cache_key = f"spotify:{current_user.id}:top-tracks:{time_range}:{limit}"
    return await _handle_spotify_request(
        cache_key,
        lambda: service.get_top_tracks(time_range, limit),
    )


@router.get("/recently-played")
async def get_recently_played(
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    service = _get_service(db, current_user)
    cache_key = f"spotify:{current_user.id}:recently-played:{limit}"
    return await _handle_spotify_request(
        cache_key,
        lambda: service.get_recently_played(limit),
    )


@router.get("/playlists")
async def get_playlists(
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    service = _get_service(db, current_user)
    cache_key = f"spotify:{current_user.id}:playlists:{limit}:{offset}"
    return await _handle_spotify_request(
        cache_key,
        lambda: service.get_playlists(limit, offset),
    )


@router.get("/saved-tracks")
async def get_saved_tracks(
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    service = _get_service(db, current_user)
    cache_key = f"spotify:{current_user.id}:saved-tracks:{limit}:{offset}"
    return await _handle_spotify_request(
        cache_key,
        lambda: service.get_saved_tracks(limit, offset),
    )


@router.get("/followed-artists")
async def get_followed_artists(
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    service = _get_service(db, current_user)
    cache_key = f"spotify:{current_user.id}:followed-artists:{limit}"
    return await _handle_spotify_request(
        cache_key,
        lambda: service.get_followed_artists(limit),
    )
