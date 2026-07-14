import type { SpotifyPlaylist } from '../types'

interface PlaylistCardProps {
  playlist: SpotifyPlaylist
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const images = playlist.images ?? []
  const image = images[0]?.url
  const spotifyUrl = playlist.external_urls?.spotify ?? '#'
  const trackCount = playlist.tracks?.total ?? 0
  const ownerName = playlist.owner?.display_name ?? 'Unknown'

  return (
    <a
      href={spotifyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 rounded-xl bg-spotify-gray p-4 transition-all hover:bg-spotify-gray/80 hover:scale-[1.02]"
    >
      {image ? (
        <img
          src={image}
          alt={playlist.name}
          className="aspect-square w-full rounded-lg object-cover shadow-lg"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-spotify-dark text-4xl">
          🎵
        </div>
      )}
      <div>
        <p className="font-semibold text-white group-hover:text-spotify-green transition-colors line-clamp-2">
          {playlist.name}
        </p>
        <p className="mt-1 text-xs text-spotify-light">
          {trackCount} tracks · {ownerName}
        </p>
      </div>
    </a>
  )
}
