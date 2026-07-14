import { useFollowedArtists } from '../hooks/useSpotifyData'
import { SectionHeader } from '../components/SectionHeader'
import { ArtistCard } from '../components/ArtistCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'

export function FollowedArtistsPage() {
  const { data, isLoading, error, refetch } = useFollowedArtists()

  const artists = data?.artists?.items ?? []

  return (
    <div>
      <SectionHeader
        title="Followed Artists"
        subtitle={`${data?.artists?.total ?? ''} artists you follow`}
      />
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage onRetry={() => refetch()} />}
      {data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      )}
    </div>
  )
}
