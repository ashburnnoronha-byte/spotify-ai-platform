import asyncio
import time

import httpx

from app.database.redis import get_redis

# Dev-mode Spotify apps share one rate-limit bucket per client_id.
GLOBAL_SEMAPHORE = asyncio.Semaphore(1)
COOLDOWN_KEY = "spotify:global_cooldown_until"


async def _wait_for_global_cooldown() -> None:
    try:
        redis = await get_redis()
        until = await redis.get(COOLDOWN_KEY)
        if until:
            wait_secs = float(until) - time.time()
            if wait_secs > 0:
                await asyncio.sleep(wait_secs)
    except Exception:
        pass


async def _set_global_cooldown(retry_after: int) -> None:
    try:
        redis = await get_redis()
        until = time.time() + retry_after
        await redis.set(COOLDOWN_KEY, str(until), ex=retry_after + 5)
    except Exception:
        pass


async def spotify_api_request(
    method: str,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    params: dict | None = None,
    max_retries: int = 4,
    max_retry_after: int = 30,
) -> httpx.Response:
    """Serialize Spotify Web API calls app-wide and honor Retry-After on 429."""
    async with GLOBAL_SEMAPHORE:
        async with httpx.AsyncClient() as client:
            for attempt in range(max_retries + 1):
                await _wait_for_global_cooldown()
                response = await client.request(
                    method,
                    url,
                    headers=headers,
                    params=params,
                )
                if response.is_success:
                    return response
                if response.status_code == 429 and attempt < max_retries:
                    retry_after = int(response.headers.get("Retry-After", "5"))
                    retry_after = min(max(retry_after, 1), max_retry_after)
                    await _set_global_cooldown(retry_after)
                    await asyncio.sleep(retry_after)
                    continue
                return response
    raise RuntimeError("Failed to complete Spotify API request")
