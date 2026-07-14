import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { storeToken } = useAuth()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const token = searchParams.get('token')

    // Strip token from URL immediately so refresh cannot re-process it
    window.history.replaceState({}, '', '/auth/callback')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    storeToken(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => navigate('/login', { replace: true }))
  }, [searchParams, storeToken, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-spotify-black">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-spotify-light">Completing login...</p>
      </div>
    </div>
  )
}
