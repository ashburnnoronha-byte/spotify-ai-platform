import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthProvider'
import { MainLayout } from './layouts/MainLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { DashboardPage } from './pages/DashboardPage'
import { TopArtistsPage } from './pages/TopArtistsPage'
import { TopTracksPage } from './pages/TopTracksPage'
import { RecentlyPlayedPage } from './pages/RecentlyPlayedPage'
import { PlaylistsPage } from './pages/PlaylistsPage'
import { SavedTracksPage } from './pages/SavedTracksPage'
import { FollowedArtistsPage } from './pages/FollowedArtistsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { ChatPage } from './pages/ChatPage'
import { HomePage } from './pages/HomePage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="artists" element={<TopArtistsPage />} />
            <Route path="tracks" element={<TopTracksPage />} />
            <Route path="recent" element={<RecentlyPlayedPage />} />
            <Route path="playlists" element={<PlaylistsPage />} />
            <Route path="library" element={<SavedTracksPage />} />
            <Route path="following" element={<FollowedArtistsPage />} />
          </Route>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
