import type { UserProfile } from '../types'

export interface AuthContextValue {
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isReady: boolean
  isError: boolean
  user: UserProfile | null
  login: () => void
  logout: () => void
  storeToken: (token: string) => Promise<void>
  refetch: () => void
}
