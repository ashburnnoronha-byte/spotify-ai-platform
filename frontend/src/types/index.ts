export interface UserProfile {
  id: number
  spotify_id: string
  email: string | null
  display_name: string | null
  profile_image_url: string | null
  country: string | null
  product: string | null
  created_at: string
}

export interface AuthStatus {
  authenticated: boolean
  user: UserProfile | null
}

export interface SpotifyImage {
  url: string
  height?: number
  width?: number
}

export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  popularity?: number
  images: SpotifyImage[]
  external_urls: Record<string, string>
}

export interface SpotifyTrack {
  id: string
  name: string
  duration_ms: number
  popularity?: number
  album: {
    name: string
    images: SpotifyImage[]
  }
  artists: { name: string }[]
  external_urls: Record<string, string>
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string | null
  images: SpotifyImage[]
  tracks: { total: number }
  owner: { display_name: string }
  external_urls: Record<string, string>
}

export interface SpotifyPaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface RecentlyPlayedItem {
  track: SpotifyTrack
  played_at: string
}

export interface SavedTrackItem {
  added_at: string
  track: SpotifyTrack
}

export type TimeRange = 'short_term' | 'medium_term' | 'long_term'

export interface SpotifyHomeResponse {
  top_artists: SpotifyPaginatedResponse<SpotifyArtist>
  top_tracks: SpotifyPaginatedResponse<SpotifyTrack>
  recently_played: { items: RecentlyPlayedItem[] }
  playlists: SpotifyPaginatedResponse<SpotifyPlaylist>
}
