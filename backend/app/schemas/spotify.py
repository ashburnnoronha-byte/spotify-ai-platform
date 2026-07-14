from typing import Any

from pydantic import BaseModel


class SpotifyHomeResponse(BaseModel):
    top_artists: dict[str, Any]
    top_tracks: dict[str, Any]
    recently_played: dict[str, Any]
    playlists: dict[str, Any]
