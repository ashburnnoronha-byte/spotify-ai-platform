from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.token_manager import get_valid_access_token
from app.config import get_settings
from app.models.user import User
from app.utils.exceptions import SpotifyAPIError
from app.utils.spotify_client import spotify_api_request

settings = get_settings()


class SpotifyService:
    def __init__(self, db: AsyncSession, user: User):
        self.db = db
        self.user = user
        self._access_token: str | None = None

    async def _get_token(self) -> str:
        if not self._access_token:
            self._access_token = await get_valid_access_token(self.db, self.user)
        return self._access_token

    async def _request(
        self,
        method: str,
        endpoint: str,
        params: dict | None = None,
    ) -> dict[str, Any]:
        token = await self._get_token()
        url = f"{settings.spotify_api_base}{endpoint}"
        headers = {"Authorization": f"Bearer {token}"}

        response = await spotify_api_request(method, url, headers=headers, params=params)
        if response.status_code == 401:
            self._access_token = await get_valid_access_token(self.db, self.user)
            headers = {"Authorization": f"Bearer {self._access_token}"}
            response = await spotify_api_request(method, url, headers=headers, params=params)

        if response.is_success:
            return response.json()

        raise SpotifyAPIError(
            response.status_code,
            f"Spotify API error ({response.status_code}): {response.text[:200]}",
        )

    async def get_home_data(self, time_range: str = "medium_term", limit: int = 20) -> dict[str, Any]:
        """Fetch dashboard data sequentially to stay within dev-mode rate limits."""
        return {
            "top_artists": await self.get_top_artists(time_range, limit),
            "top_tracks": await self.get_top_tracks(time_range, limit),
            "recently_played": await self.get_recently_played(limit),
            "playlists": await self.get_playlists(limit, 0),
        }

    async def get_current_user_profile(self) -> dict[str, Any]:
        return await self._request("GET", "/me")

    async def get_top_artists(
        self, time_range: str = "medium_term", limit: int = 20
    ) -> dict[str, Any]:
        return await self._request(
            "GET",
            "/me/top/artists",
            params={"time_range": time_range, "limit": limit},
        )

    async def get_top_tracks(
        self, time_range: str = "medium_term", limit: int = 20
    ) -> dict[str, Any]:
        return await self._request(
            "GET",
            "/me/top/tracks",
            params={"time_range": time_range, "limit": limit},
        )

    async def get_recently_played(self, limit: int = 20) -> dict[str, Any]:
        return await self._request(
            "GET",
            "/me/player/recently-played",
            params={"limit": limit},
        )

    async def get_playlists(self, limit: int = 20, offset: int = 0) -> dict[str, Any]:
        return await self._request(
            "GET",
            "/me/playlists",
            params={"limit": limit, "offset": offset},
        )

    async def get_saved_tracks(self, limit: int = 20, offset: int = 0) -> dict[str, Any]:
        return await self._request(
            "GET",
            "/me/tracks",
            params={"limit": limit, "offset": offset},
        )

    async def get_followed_artists(self, limit: int = 20) -> dict[str, Any]:
        return await self._request(
            "GET",
            "/me/following",
            params={"type": "artist", "limit": limit},
        )

    async def get_audio_features(self, track_ids: list[str]) -> list[dict[str, Any]]:
        """Fetch audio features. Returns empty list if endpoint is unavailable (403)."""
        if not track_ids:
            return []

        features: list[dict[str, Any]] = []
        for i in range(0, len(track_ids), 100):
            batch = track_ids[i : i + 100]
            try:
                result = await self._request(
                    "GET",
                    "/audio-features",
                    params={"ids": ",".join(batch)},
                )
                features.extend(f for f in result.get("audio_features", []) if f)
            except SpotifyAPIError as e:
                # Spotify restricted audio-features for many development apps
                if e.status_code in (403, 404):
                    return []
                raise

        return features
