import { useSavedTracks } from '../hooks/useSpotifyData'
import { SectionHeader } from '../components/SectionHeader'
import { TrackRow } from '../components/TrackRow'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { formatDate } from '../utils/format'

export function SavedTracksPage() {
  const { data, isLoading, error, refetch } = useSavedTracks()

  return (
    <div>
      <SectionHeader
        title="Saved Tracks"
        subtitle={`${data?.total ?? ''} songs in your library`}
      />
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage onRetry={() => refetch()} />}
      {data && (
        <div className="rounded-xl bg-spotify-dark p-2">
          {data.items.map((item) => (
            <TrackRow
              key={`${item.track.id}-${item.added_at}`}
              track={item.track}
              subtitle={`Saved ${formatDate(item.added_at)}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
