import type { SpotifyArtist } from '../types'

interface ArtistCardProps {
  artist: SpotifyArtist
  rank?: number
}

export function ArtistCard({ artist, rank }: ArtistCardProps) {
  const images = artist.images ?? []
  const genres = artist.genres ?? []
  const image = images[0]?.url
  const spotifyUrl = artist.external_urls?.spotify ?? '#'

  return (
    <a
      href={spotifyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center gap-3 rounded-xl bg-spotify-gray p-4 transition-all hover:bg-spotify-gray/80 hover:scale-[1.02]"
    >
      <div className="relative">
        {rank && (
          <span className="absolute -left-1 -top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-spotify-green text-xs font-bold text-black">
            {rank}
          </span>
        )}
        {image ? (
          <img
            src={image}
            alt={artist.name}
            className="h-32 w-32 rounded-full object-cover shadow-lg"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-spotify-dark text-spotify-light">
            🎵
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="font-semibold text-white group-hover:text-spotify-green transition-colors line-clamp-1">
          {artist.name}
        </p>
        {genres.length > 0 && (
          <p className="mt-1 text-xs text-spotify-light line-clamp-1">
            {genres.slice(0, 2).join(', ')}
          </p>
        )}
        {artist.popularity !== undefined && (
          <p className="mt-1 text-xs text-spotify-light">
            Popularity: {artist.popularity}
          </p>
        )}
      </div>
    </a>
  )
}
