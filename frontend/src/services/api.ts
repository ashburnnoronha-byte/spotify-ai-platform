import axios from 'axios'
import { getToken } from '../utils/token'
import type { AnalyticsDashboard } from '../types/analytics'
import type { ChatRequest, ChatResponse, IndexResponse } from '../types/chat'
import type {
  AuthStatus,
  SpotifyArtist,
  SpotifyPaginatedResponse,
  SpotifyPlaylist,
  SpotifyTrack,
  RecentlyPlayedItem,
  SavedTrackItem,
  SpotifyHomeResponse,
  TimeRange,
  UserProfile,
} from '../types'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

function resolveUrl(path: string): string {
  if (API_BASE.startsWith('http')) {
    return `${API_BASE}${path}`
  }
  return `${window.location.origin}${API_BASE}${path}`
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export const authApi = {
  getLoginUrl: () => resolveUrl('/auth/login'),
  getStatus: () => api.get<AuthStatus>('/auth/status').then((r) => r.data),
  getMe: () => api.get<UserProfile>('/auth/me').then((r) => r.data),
  refresh: () => api.post<{ access_token: string; user: UserProfile }>('/auth/refresh').then((r) => r.data),
  logout: () => api.post('/auth/logout'),
}

export const spotifyApi = {
  getHome: (timeRange: TimeRange = 'medium_term', limit = 20) =>
    api
      .get<SpotifyHomeResponse>('/spotify/home', {
        params: { time_range: timeRange, limit },
      })
      .then((r) => r.data),

  getTopArtists: (timeRange: TimeRange = 'medium_term', limit = 20) =>
    api
      .get<SpotifyPaginatedResponse<SpotifyArtist>>('/spotify/top-artists', {
        params: { time_range: timeRange, limit },
      })
      .then((r) => r.data),

  getTopTracks: (timeRange: TimeRange = 'medium_term', limit = 20) =>
    api
      .get<SpotifyPaginatedResponse<SpotifyTrack>>('/spotify/top-tracks', {
        params: { time_range: timeRange, limit },
      })
      .then((r) => r.data),

  getRecentlyPlayed: (limit = 20) =>
    api
      .get<{ items: RecentlyPlayedItem[] }>('/spotify/recently-played', { params: { limit } })
      .then((r) => r.data),

  getPlaylists: (limit = 20, offset = 0) =>
    api
      .get<SpotifyPaginatedResponse<SpotifyPlaylist>>('/spotify/playlists', {
        params: { limit, offset },
      })
      .then((r) => r.data),

  getSavedTracks: (limit = 20, offset = 0) =>
    api
      .get<{ items: SavedTrackItem[]; total: number }>('/spotify/saved-tracks', {
        params: { limit, offset },
      })
      .then((r) => r.data),

  getFollowedArtists: (limit = 20) =>
    api
      .get<{ artists: SpotifyPaginatedResponse<SpotifyArtist> }>('/spotify/followed-artists', {
        params: { limit },
      })
      .then((r) => r.data),
}

export const analyticsApi = {
  getDashboard: (timeRange: TimeRange = 'medium_term') =>
    api
      .get<AnalyticsDashboard>('/analytics/dashboard', { params: { time_range: timeRange } })
      .then((r) => r.data),
}

export const chatApi = {
  sendMessage: (payload: ChatRequest) =>
    api.post<ChatResponse>('/chat', payload).then((r) => r.data),
  indexSpotifyData: () => api.post<IndexResponse>('/chat/index').then((r) => r.data),
}

export default api
