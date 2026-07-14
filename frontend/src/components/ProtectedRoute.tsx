import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getToken } from '../utils/token'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth()
  const hasToken = !!getToken()

  // Optimistic: if token exists, always render dashboard (never blank spinner)
  if (hasToken || isAuthenticated) {
    return <>{children}</>
  }

  return <Navigate to="/login" replace />
}
