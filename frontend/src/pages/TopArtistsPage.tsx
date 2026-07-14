import { useState } from 'react'
import { useTopArtists } from '../hooks/useSpotifyData'
import { SectionHeader } from '../components/SectionHeader'
import { ArtistCard } from '../components/ArtistCard'
import { TimeRangeSelector } from '../components/TimeRangeSelector'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import type { TimeRange } from '../types'

export function TopArtistsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term')
  const { data, isLoading, error, refetch } = useTopArtists(timeRange)

  return (
    <div>
      <SectionHeader
        title="Top Artists"
        subtitle="Artists you listen to the most"
        action={<TimeRangeSelector value={timeRange} onChange={setTimeRange} />}
      />
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage onRetry={() => refetch()} />}
      {data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.items.map((artist, i) => (
            <ArtistCard key={artist.id} artist={artist} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
