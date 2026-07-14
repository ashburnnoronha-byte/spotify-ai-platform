from collections import Counter, defaultdict
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.analytics import (
    AnalyticsDashboard,
    AudioFeaturesAnalysis,
    ListeningTimeStats,
    NamedValue,
    TopArtistItem,
    TopTrackItem,
)
from app.services.spotify_service import SpotifyService

AUDIO_FEATURE_KEYS = (
    "danceability",
    "energy",
    "loudness",
    "valence",
    "acousticness",
    "instrumentalness",
    "tempo",
)


def _normalize_loudness(loudness: float) -> float:
    # Spotify loudness is typically -60 to 0 dB
    return max(0.0, min(1.0, (loudness + 60) / 60))


def _normalize_tempo(tempo: float) -> float:
    return max(0.0, min(1.0, tempo / 200))


def _build_genre_distribution(artists: list[dict]) -> list[NamedValue]:
    counter: Counter[str] = Counter()
    for artist in artists:
        for genre in artist.get("genres") or []:
            counter[genre] += 1

    top_genres = counter.most_common(8)
    return [NamedValue(name=g, value=float(c)) for g, c in top_genres]


def _build_monthly_listening(items: list[dict]) -> list[NamedValue]:
    monthly: dict[str, int] = defaultdict(int)
    for item in items:
        played_at = item.get("played_at")
        if not played_at:
            continue
        dt = datetime.fromisoformat(played_at.replace("Z", "+00:00"))
        key = dt.strftime("%b %Y")
        monthly[key] += 1

    # Sort chronologically
    sorted_months = sorted(
        monthly.items(),
        key=lambda x: datetime.strptime(x[0], "%b %Y"),
    )
    return [NamedValue(name=m, value=float(c)) for m, c in sorted_months]


def _aggregate_audio_features(features: list[dict]) -> AudioFeaturesAnalysis | None:
    valid = [f for f in features if f and f.get("id")]
    if not valid:
        return None

    n = len(valid)
    avg = {key: sum(f.get(key, 0) or 0 for f in valid) / n for key in AUDIO_FEATURE_KEYS}

    return AudioFeaturesAnalysis(
        danceability=round(avg["danceability"], 3),
        energy=round(avg["energy"], 3),
        loudness=round(avg["loudness"], 2),
        valence=round(avg["valence"], 3),
        acousticness=round(avg["acousticness"], 3),
        instrumentalness=round(avg["instrumentalness"], 3),
        tempo=round(avg["tempo"], 1),
        danceability_norm=round(avg["danceability"], 3),
        energy_norm=round(avg["energy"], 3),
        loudness_norm=round(_normalize_loudness(avg["loudness"]), 3),
        valence_norm=round(avg["valence"], 3),
        acousticness_norm=round(avg["acousticness"], 3),
        instrumentalness_norm=round(avg["instrumentalness"], 3),
        tempo_norm=round(_normalize_tempo(avg["tempo"]), 3),
    )


class AnalyticsService:
    def __init__(self, db: AsyncSession, user: User):
        self.spotify = SpotifyService(db, user)

    async def get_dashboard(self, time_range: str = "medium_term") -> AnalyticsDashboard:
        top_artists_data = await self.spotify.get_top_artists(time_range, 20)
        top_tracks_data = await self.spotify.get_top_tracks(time_range, 20)
        recently_played_data = await self.spotify.get_recently_played(50)

        artists = top_artists_data.get("items", [])
        tracks = top_tracks_data.get("items", [])
        recent_items = recently_played_data.get("items", [])

        top_artists = [
            TopArtistItem(
                id=a["id"],
                name=a["name"],
                popularity=a.get("popularity", 0),
                genres=a.get("genres") or [],
                image_url=(a.get("images") or [{}])[0].get("url"),
            )
            for a in artists
        ]

        top_tracks = [
            TopTrackItem(
                id=t["id"],
                name=t["name"],
                artist=", ".join(ar["name"] for ar in t.get("artists", [])),
                popularity=t.get("popularity", 0),
                duration_ms=t.get("duration_ms", 0),
            )
            for t in tracks
        ]

        artist_popularity = [
            NamedValue(name=a.name, value=float(a.popularity)) for a in top_artists[:10]
        ]

        track_ids = [t["id"] for t in tracks if t.get("id")]
        audio_features_raw = await self.spotify.get_audio_features(track_ids)
        audio_features = _aggregate_audio_features(audio_features_raw)

        total_ms = sum(
            item.get("track", {}).get("duration_ms", 0) for item in recent_items
        )

        return AnalyticsDashboard(
            time_range=time_range,
            top_artists=top_artists,
            top_tracks=top_tracks,
            genre_distribution=_build_genre_distribution(artists),
            artist_popularity=artist_popularity,
            monthly_listening=_build_monthly_listening(recent_items),
            listening_time=ListeningTimeStats(
                total_ms=total_ms,
                total_hours=round(total_ms / 3_600_000, 1),
                track_count=len(recent_items),
            ),
            audio_features=audio_features,
        )
