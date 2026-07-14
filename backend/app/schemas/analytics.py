from pydantic import BaseModel


class NamedValue(BaseModel):
    name: str
    value: float


class TopArtistItem(BaseModel):
    id: str
    name: str
    popularity: int
    genres: list[str] = []
    image_url: str | None = None


class TopTrackItem(BaseModel):
    id: str
    name: str
    artist: str
    popularity: int
    duration_ms: int


class AudioFeaturesAnalysis(BaseModel):
    danceability: float
    energy: float
    loudness: float
    valence: float
    acousticness: float
    instrumentalness: float
    tempo: float
    # Normalized 0–1 for radar chart
    danceability_norm: float
    energy_norm: float
    loudness_norm: float
    valence_norm: float
    acousticness_norm: float
    instrumentalness_norm: float
    tempo_norm: float


class ListeningTimeStats(BaseModel):
    total_ms: int
    total_hours: float
    track_count: int


class AnalyticsDashboard(BaseModel):
    time_range: str
    top_artists: list[TopArtistItem]
    top_tracks: list[TopTrackItem]
    genre_distribution: list[NamedValue]
    artist_popularity: list[NamedValue]
    monthly_listening: list[NamedValue]
    listening_time: ListeningTimeStats
    audio_features: AudioFeaturesAnalysis | None
