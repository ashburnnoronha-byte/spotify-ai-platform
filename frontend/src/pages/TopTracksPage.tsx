import { useState } from 'react'
import { useTopTracks } from '../hooks/useSpotifyData'
import { SectionHeader } from '../components/SectionHeader'
import { TrackRow } from '../components/TrackRow'
import { TimeRangeSelector } from '../components/TimeRangeSelector'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import type { TimeRange } from '../types'

export function TopTracksPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term')
  const { data, isLoading, error, refetch } = useTopTracks(timeRange)

  return (
    <div>
      <SectionHeader
        title="Top Tracks"
        subtitle="Your most played songs"
        action={<TimeRangeSelector value={timeRange} onChange={setTimeRange} />}
      />
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage onRetry={() => refetch()} />}
      {data && (
        <div className="rounded-xl bg-spotify-dark p-2">
          {data.items.map((track, i) => (
            <TrackRow key={track.id} track={track} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
