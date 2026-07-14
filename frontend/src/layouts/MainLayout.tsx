import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/dashboard/analytics', label: 'Analytics' },
  { to: '/dashboard/chat', label: 'AI Chat' },
  { to: '/dashboard/artists', label: 'Top Artists' },
  { to: '/dashboard/tracks', label: 'Top Tracks' },
  { to: '/dashboard/recent', label: 'Recently Played' },
  { to: '/dashboard/playlists', label: 'Playlists' },
  { to: '/dashboard/library', label: 'Saved Tracks' },
  { to: '/dashboard/following', label: 'Following' },
]

export function MainLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-spotify-black">
      <aside className="fixed left-0 top-0 flex h-full w-64 flex-col bg-spotify-dark p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">
            <span className="text-spotify-green">AI</span> Music
          </h1>
          <p className="text-xs text-spotify-light mt-1">Intelligence Platform</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-spotify-gray text-white'
                    : 'text-spotify-light hover:text-white hover:bg-spotify-gray/50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="border-t border-spotify-gray pt-4">
            <div className="flex items-center gap-3 mb-3">
              {user.profile_image_url ? (
                <img
                  src={user.profile_image_url}
                  alt={user.display_name || 'User'}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-spotify-gray text-sm">
                  👤
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {user.display_name || 'Spotify User'}
                </p>
                <p className="truncate text-xs text-spotify-light capitalize">
                  {user.product || 'free'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full rounded-lg bg-spotify-gray px-3 py-2 text-sm text-spotify-light transition-colors hover:bg-spotify-gray/80 hover:text-white"
            >
              Log out
            </button>
          </div>
        )}
      </aside>

      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}
