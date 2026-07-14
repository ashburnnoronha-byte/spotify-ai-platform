import { usePlaylists } from '../hooks/useSpotifyData'
import { SectionHeader } from '../components/SectionHeader'
import { PlaylistCard } from '../components/PlaylistCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'

export function PlaylistsPage() {
  const { data, isLoading, error, refetch } = usePlaylists()

  return (
    <div>
      <SectionHeader
        title="Your Playlists"
        subtitle={`${data?.total ?? ''} playlists in your library`}
      />
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage onRetry={() => refetch()} />}
      {data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.items.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      )}
    </div>
  )
}
