import type { SpotifyTrack } from '../types'
import { formatDuration } from '../utils/format'

interface TrackRowProps {
  track: SpotifyTrack
  rank?: number
  subtitle?: string
}

export function TrackRow({ track, rank, subtitle }: TrackRowProps) {
  const image = track.album?.images?.[2]?.url || track.album?.images?.[0]?.url
  const artists = (track.artists ?? []).map((a) => a.name).join(', ')
  const spotifyUrl = track.external_urls?.spotify ?? '#'

  return (
    <a
      href={spotifyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-spotify-gray"
    >
      {rank !== undefined && (
        <span className="w-6 text-center text-sm text-spotify-light">{rank}</span>
      )}
      {image ? (
        <img src={image} alt={track.album?.name ?? track.name} className="h-10 w-10 rounded object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded bg-spotify-gray text-sm">
          🎵
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white group-hover:text-spotify-green transition-colors">
          {track.name}
        </p>
        <p className="truncate text-sm text-spotify-light">
          {subtitle || `${artists} · ${track.album?.name}`}
        </p>
      </div>
      <span className="text-sm text-spotify-light">{formatDuration(track.duration_ms ?? 0)}</span>
    </a>
  )
}
