import type { AxiosError } from 'axios'

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  const axiosError = error as AxiosError<{ detail?: string }>
  const status = axiosError.response?.status
  const detail = axiosError.response?.data?.detail

  if (status === 429) {
    return 'Spotify rate limit reached. Wait a moment and try again.'
  }
  if (typeof detail === 'string' && detail.length > 0) {
    return detail
  }
  return fallback
}
