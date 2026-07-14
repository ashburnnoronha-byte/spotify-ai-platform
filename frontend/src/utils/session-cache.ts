import type { UserProfile } from '../types'

const USER_KEY = 'auth_user_cache'

export function getCachedUser(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as UserProfile) : null
  } catch {
    return null
  }
}

export function setCachedUser(user: UserProfile | null): void {
  if (user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    sessionStorage.removeItem(USER_KEY)
  }
}
