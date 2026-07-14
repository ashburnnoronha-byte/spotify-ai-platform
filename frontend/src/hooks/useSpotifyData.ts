import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { spotifyApi } from '../services/api'
import { useAuth } from './useAuth'
import type { TimeRange } from '../types'

const SPOTIFY_QUERY_OPTIONS = {
  staleTime: 15 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: (failureCount: number, error: AxiosError) =>
    error.response?.status === 429 && failureCount < 3,
  retryDelay: (attemptIndex: number) => Math.min(2000 * 2 ** attemptIndex, 30000),
}

export function useDashboardHome(timeRange: TimeRange = 'medium_term') {
  const { isAuthenticated, isReady } = useAuth()
  return useQuery({
    queryKey: ['spotify', 'home', timeRange],
    queryFn: () => spotifyApi.getHome(timeRange),
    enabled: isAuthenticated && isReady,
    ...SPOTIFY_QUERY_OPTIONS,
  })
}

function useSpotifyEnabled() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}

export function useTopArtists(timeRange: TimeRange = 'medium_term') {
  const enabled = useSpotifyEnabled()
  return useQuery({
    queryKey: ['spotify', 'top-artists', timeRange],
    queryFn: () => spotifyApi.getTopArtists(timeRange),
    enabled,
    ...SPOTIFY_QUERY_OPTIONS,
  })
}

export function useTopTracks(timeRange: TimeRange = 'medium_term') {
  const enabled = useSpotifyEnabled()
  return useQuery({
    queryKey: ['spotify', 'top-tracks', timeRange],
    queryFn: () => spotifyApi.getTopTracks(timeRange),
    enabled,
    ...SPOTIFY_QUERY_OPTIONS,
  })
}

export function useRecentlyPlayed() {
  const enabled = useSpotifyEnabled()
  return useQuery({
    queryKey: ['spotify', 'recently-played'],
    queryFn: () => spotifyApi.getRecentlyPlayed(),
    enabled,
    ...SPOTIFY_QUERY_OPTIONS,
  })
}

export function usePlaylists() {
  const enabled = useSpotifyEnabled()
  return useQuery({
    queryKey: ['spotify', 'playlists'],
    queryFn: () => spotifyApi.getPlaylists(),
    enabled,
    ...SPOTIFY_QUERY_OPTIONS,
  })
}

export function useSavedTracks() {
  const enabled = useSpotifyEnabled()
  return useQuery({
    queryKey: ['spotify', 'saved-tracks'],
    queryFn: () => spotifyApi.getSavedTracks(),
    enabled,
  })
}

export function useFollowedArtists() {
  const enabled = useSpotifyEnabled()
  return useQuery({
    queryKey: ['spotify', 'followed-artists'],
    queryFn: () => spotifyApi.getFollowedArtists(),
    enabled,
  })
}
