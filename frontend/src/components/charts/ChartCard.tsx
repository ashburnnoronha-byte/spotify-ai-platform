interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, subtitle, children, className = '' }: ChartCardProps) {
  return (
    <div className={`rounded-2xl bg-spotify-dark border border-spotify-gray/40 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-spotify-light">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
