import type { TimeRange } from './index'

export interface NamedValue {
  name: string
  value: number
}

export interface TopArtistAnalytics {
  id: string
  name: string
  popularity: number
  genres: string[]
  image_url: string | null
}

export interface TopTrackAnalytics {
  id: string
  name: string
  artist: string
  popularity: number
  duration_ms: number
}

export interface AudioFeaturesAnalysis {
  danceability: number
  energy: number
  loudness: number
  valence: number
  acousticness: number
  instrumentalness: number
  tempo: number
  danceability_norm: number
  energy_norm: number
  loudness_norm: number
  valence_norm: number
  acousticness_norm: number
  instrumentalness_norm: number
  tempo_norm: number
}

export interface ListeningTimeStats {
  total_ms: number
  total_hours: number
  track_count: number
}

export interface AnalyticsDashboard {
  time_range: TimeRange
  top_artists: TopArtistAnalytics[]
  top_tracks: TopTrackAnalytics[]
  genre_distribution: NamedValue[]
  artist_popularity: NamedValue[]
  monthly_listening: NamedValue[]
  listening_time: ListeningTimeStats
  audio_features: AudioFeaturesAnalysis | null
}
