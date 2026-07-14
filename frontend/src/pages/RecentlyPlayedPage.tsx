import { useRecentlyPlayed } from '../hooks/useSpotifyData'
import { SectionHeader } from '../components/SectionHeader'
import { TrackRow } from '../components/TrackRow'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { formatRelativeTime } from '../utils/format'

export function RecentlyPlayedPage() {
  const { data, isLoading, error, refetch } = useRecentlyPlayed()

  return (
    <div>
      <SectionHeader
        title="Recently Played"
        subtitle="Your listening history from the past few days"
      />
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage onRetry={() => refetch()} />}
      {data && (
        <div className="rounded-xl bg-spotify-dark p-2">
          {data.items.map((item) => (
            <TrackRow
              key={`${item.track.id}-${item.played_at}`}
              track={item.track}
              subtitle={formatRelativeTime(item.played_at)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
