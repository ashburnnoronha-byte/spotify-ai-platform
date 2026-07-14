import { useAuth } from '../hooks/useAuth'
import { useDashboardHome } from '../hooks/useSpotifyData'
import { SectionHeader } from '../components/SectionHeader'
import { ArtistCard } from '../components/ArtistCard'
import { TrackRow } from '../components/TrackRow'
import { PlaylistCard } from '../components/PlaylistCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { getApiErrorMessage } from '../utils/api-error'

export function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, error, refetch } = useDashboardHome()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-spotify-light">Loading your music data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <ErrorMessage
        message={getApiErrorMessage(error, 'Failed to load dashboard. Please try again.')}
        onRetry={() => refetch()}
      />
    )
  }

  if (!data) return null

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white">
          Welcome back, {user?.display_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="mt-2 text-spotify-light">
          Here's a snapshot of your music taste. More AI-powered insights coming soon.
        </p>
      </div>

      <section className="mb-12">
        <SectionHeader title="Top Artists" subtitle="Your most played artists" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.top_artists.items.slice(0, 5).map((artist, i) => (
            <ArtistCard key={artist.id} artist={artist} rank={i + 1} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <SectionHeader title="Top Tracks" subtitle="Songs you can't stop playing" />
        <div className="rounded-xl bg-spotify-dark p-2">
          {data.top_tracks.items.slice(0, 5).map((track, i) => (
            <TrackRow key={track.id} track={track} rank={i + 1} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <SectionHeader title="Recently Played" subtitle="Your latest listening history" />
        <div className="rounded-xl bg-spotify-dark p-2">
          {data.recently_played.items.slice(0, 5).map((item) => (
            <TrackRow
              key={`${item.track.id}-${item.played_at}`}
              track={item.track}
              subtitle={new Date(item.played_at).toLocaleString()}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Your Playlists" subtitle="Playlists you've created or follow" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {data.playlists.items.slice(0, 4).map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </section>
    </div>
  )
}
