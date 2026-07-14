import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { authApi } from '../services/api'
import { getToken, setToken, clearToken } from '../utils/token'
import { getCachedUser, setCachedUser } from '../utils/session-cache'
import type { UserProfile } from '../types'
import type { AuthContextValue } from './auth-types'
import { AuthContext } from './auth-context'

function readInitialState(): {
  token: string | null
  user: UserProfile | null
  isAuthenticated: boolean
} {
  const token = getToken()
  const cachedUser = getCachedUser()
  if (token && cachedUser) {
    return { token, user: cachedUser, isAuthenticated: true }
  }
  return { token, user: null, isAuthenticated: false }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = useRef(readInitialState()).current
  const [token, setTokenState] = useState<string | null>(initial.token)
  const [user, setUser] = useState<UserProfile | null>(initial.user)
  const [isAuthenticated, setIsAuthenticated] = useState(initial.isAuthenticated)
  const [isVerifying, setIsVerifying] = useState(!!initial.token)
  const [isError, setIsError] = useState(false)
  const verified = useRef(initial.isAuthenticated)

  const applySession = useCallback((jwt: string, profile: UserProfile) => {
    setToken(jwt)
    setTokenState(jwt)
    setUser(profile)
    setCachedUser(profile)
    setIsAuthenticated(true)
    setIsError(false)
    setIsVerifying(false)
    verified.current = true
  }, [])

  const clearSession = useCallback(() => {
    clearToken()
    setCachedUser(null)
    setTokenState(null)
    setUser(null)
    setIsAuthenticated(false)
    setIsError(false)
    setIsVerifying(false)
    verified.current = false
  }, [])

  const verifyToken = useCallback(
    async (jwt: string): Promise<boolean> => {
      try {
        setToken(jwt)
        setTokenState(jwt)
        const result = await authApi.getStatus()

        if (result.authenticated && result.user) {
          applySession(jwt, result.user)
          return true
        }

        clearSession()
        return false
      } catch {
        // Keep optimistic session on network errors if we had a cached user
        if (verified.current && getCachedUser()) {
          setIsVerifying(false)
          setIsError(true)
          return true
        }
        clearSession()
        setIsError(true)
        return false
      }
    },
    [applySession, clearSession]
  )

  useEffect(() => {
    const existing = getToken()
    if (!existing) {
      setIsVerifying(false)
      return
    }

    if (window.location.pathname === '/auth/callback') {
      return
    }

    void verifyToken(existing)
  }, [verifyToken])

  const login = useCallback(() => {
    window.location.href = authApi.getLoginUrl()
  }, [])

  const logout = useCallback(() => {
    clearSession()
    window.location.href = '/login'
  }, [clearSession])

  const storeToken = useCallback(
    async (newToken: string) => {
      const ok = await verifyToken(newToken)
      if (!ok) throw new Error('Session verification failed')
    },
    [verifyToken]
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated,
      isLoading: isVerifying && !isAuthenticated,
      isReady: !isVerifying || isAuthenticated,
      isError,
      user,
      login,
      logout,
      storeToken,
      refetch: () => {
        const t = getToken()
        if (t) void verifyToken(t)
      },
    }),
    [token, isAuthenticated, isVerifying, isError, user, login, logout, storeToken, verifyToken]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
