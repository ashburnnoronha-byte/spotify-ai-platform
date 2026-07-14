import secrets
from urllib.parse import urlencode

import httpx

from app.config import get_settings
from app.database.redis import get_redis
from app.utils.spotify_client import spotify_api_request

settings = get_settings()

OAUTH_STATE_TTL = 600  # 10 minutes


async def generate_oauth_state() -> str:
    state = secrets.token_urlsafe(32)
    redis = await get_redis()
    await redis.setex(f"oauth_state:{state}", OAUTH_STATE_TTL, "1")
    return state


async def validate_oauth_state(state: str) -> bool:
    redis = await get_redis()
    key = f"oauth_state:{state}"
    exists = await redis.get(key)
    if exists:
        await redis.delete(key)
        return True
    return False


def build_authorization_url(state: str) -> str:
    params = {
        "client_id": settings.spotify_client_id,
        "response_type": "code",
        "redirect_uri": settings.spotify_redirect_uri,
        "scope": settings.spotify_scopes,
        "state": state,
        "show_dialog": "false",
    }
    return f"{settings.spotify_authorize_url}?{urlencode(params)}"


async def exchange_code_for_tokens(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            settings.spotify_token_url,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.spotify_redirect_uri,
            },
            auth=(settings.spotify_client_id, settings.spotify_client_secret),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        response.raise_for_status()
        return response.json()


async def fetch_spotify_profile(access_token: str) -> dict:
    url = f"{settings.spotify_api_base}/me"
    response = await spotify_api_request(
        "GET",
        url,
        headers={"Authorization": f"Bearer {access_token}"},
        max_retries=6,
        max_retry_after=60,
    )
    response.raise_for_status()
    return response.json()


async def refresh_spotify_tokens(refresh_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            settings.spotify_token_url,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            },
            auth=(settings.spotify_client_id, settings.spotify_client_secret),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        response.raise_for_status()
        return response.json()
