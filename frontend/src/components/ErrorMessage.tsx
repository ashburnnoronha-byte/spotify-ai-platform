interface ErrorMessageProps {
  message?: string
  onRetry?: () => void
}

export function ErrorMessage({ message = 'Something went wrong', onRetry }: ErrorMessageProps) {
  return (
    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-6 text-center">
      <p className="text-red-400 mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-spotify-green hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  )
}
