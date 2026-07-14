import { useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useAnalyticsDashboard } from '../hooks/useAnalytics'
import { ChartCard } from '../components/charts/ChartCard'
import { TimeRangeSelector } from '../components/TimeRangeSelector'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import {
  CHART_COLORS,
  CHART_TOOLTIP_STYLE,
  CHART_AXIS_STYLE,
  CHART_GRID_STYLE,
} from '../components/charts/chart-theme'
import type { TimeRange } from '../types'
import type { AudioFeaturesAnalysis } from '../types/analytics'
import { getApiErrorMessage } from '../utils/api-error'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-spotify-dark border border-spotify-gray/40 p-6">
      <p className="text-sm text-spotify-light">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-spotify-light">{sub}</p>}
    </div>
  )
}

function buildRadarData(features: AudioFeaturesAnalysis) {
  return [
    { feature: 'Danceability', value: features.danceability_norm, raw: features.danceability },
    { feature: 'Energy', value: features.energy_norm, raw: features.energy },
    { feature: 'Valence', value: features.valence_norm, raw: features.valence },
    { feature: 'Acoustic', value: features.acousticness_norm, raw: features.acousticness },
    { feature: 'Instrumental', value: features.instrumentalness_norm, raw: features.instrumentalness },
    { feature: 'Loudness', value: features.loudness_norm, raw: features.loudness },
    { feature: 'Tempo', value: features.tempo_norm, raw: features.tempo },
  ]
}

const RADAR_TOOLTIP = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { feature: string; raw: number } }> }) => {
  if (!active || !payload?.length) return null
  const { feature, raw } = payload[0].payload
  const unit = feature === 'Loudness' ? ' dB' : feature === 'Tempo' ? ' BPM' : ''
  const display = feature === 'Tempo' || feature === 'Loudness' ? raw : `${(raw * 100).toFixed(0)}%`
  return (
    <div style={CHART_TOOLTIP_STYLE} className="px-3 py-2 text-sm">
      <p className="font-medium">{feature}</p>
      <p className="text-spotify-green">{display}{unit}</p>
    </div>
  )
}

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term')
  const { data, isLoading, error, refetch } = useAnalyticsDashboard(timeRange)

  if (isLoading) return <LoadingSpinner />
  if (error) {
    return (
      <ErrorMessage
        message={getApiErrorMessage(error, 'Failed to load analytics. Please try again.')}
        onRetry={() => refetch()}
      />
    )
  }
  if (!data) return null

  const radarData = data.audio_features ? buildRadarData(data.audio_features) : []

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="mt-2 text-spotify-light">
            Deep insights into your listening habits and music taste
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Recent Listening"
          value={`${data.listening_time.total_hours}h`}
          sub={`${data.listening_time.track_count} tracks in recently played`}
        />
        <StatCard
          label="Top Artists"
          value={String(data.top_artists.length)}
          sub="Based on your listening history"
        />
        <StatCard
          label="Dominant Genre"
          value={data.genre_distribution[0]?.name ?? '—'}
          sub={
            data.genre_distribution[0]
              ? `${data.genre_distribution[0].value} artist matches`
              : 'No genre data'
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Genre Distribution - Pie */}
        <ChartCard title="Genre Distribution" subtitle="Genres across your top artists">
          {data.genre_distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.genre_distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {data.genre_distribution.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ color: '#b3b3b3', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-spotify-light">No genre data available</p>
          )}
        </ChartCard>

        {/* Audio Features - Radar */}
        <ChartCard title="Audio Features" subtitle="Average profile of your top tracks">
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#535353" />
                <PolarAngleAxis dataKey="feature" tick={CHART_AXIS_STYLE} />
                <PolarRadiusAxis angle={90} domain={[0, 1]} tick={false} axisLine={false} />
                <Radar
                  name="Your Taste"
                  dataKey="value"
                  stroke="#1DB954"
                  fill="#1DB954"
                  fillOpacity={0.35}
                />
                <Tooltip content={<RADAR_TOOLTIP />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-spotify-light">
              Audio features unavailable — Spotify restricts this endpoint for development apps
            </p>
          )}
        </ChartCard>

        {/* Top Artists - Bar */}
        <ChartCard title="Top Artists" subtitle="Your most played artists">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.top_artists.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STYLE.stroke} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={CHART_AXIS_STYLE}
                tickFormatter={(v: string) => (v.length > 14 ? `${v.slice(0, 14)}…` : v)}
              />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="popularity" fill="#1DB954" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Artist Popularity - Bar */}
        <ChartCard title="Artist Popularity" subtitle="Spotify popularity score (0–100)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.artist_popularity}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STYLE.stroke} />
              <XAxis
                dataKey="name"
                tick={CHART_AXIS_STYLE}
                tickFormatter={(v: string) => (v.length > 10 ? `${v.slice(0, 10)}…` : v)}
              />
              <YAxis domain={[0, 100]} tick={CHART_AXIS_STYLE} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#509bf5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Songs - Bar */}
        <ChartCard title="Top Songs" subtitle="Your most played tracks">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.top_tracks.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STYLE.stroke} />
              <XAxis type="number" domain={[0, 100]} tick={CHART_AXIS_STYLE} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={CHART_AXIS_STYLE}
                tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 16)}…` : v)}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number) => [`${value}`, 'Popularity']}
              />
              <Bar dataKey="popularity" fill="#b49bc8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly Listening - Line */}
        <ChartCard title="Monthly Listening Trends" subtitle="Plays per month from recent history">
          {data.monthly_listening.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthly_listening}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STYLE.stroke} />
                <XAxis dataKey="name" tick={CHART_AXIS_STYLE} />
                <YAxis tick={CHART_AXIS_STYLE} allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#1DB954"
                  strokeWidth={2}
                  dot={{ fill: '#1DB954', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-spotify-light">
              Play more music to see monthly trends
            </p>
          )}
        </ChartCard>
      </div>

      {/* Listening Time detail */}
      <ChartCard title="Listening Time" subtitle="Estimated from your recently played tracks">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={[
              { label: 'Hours Listened', hours: data.listening_time.total_hours },
              { label: 'Tracks Played', hours: data.listening_time.track_count },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STYLE.stroke} />
            <XAxis dataKey="label" tick={CHART_AXIS_STYLE} />
            <YAxis tick={CHART_AXIS_STYLE} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar dataKey="hours" fill="#f59b23" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
