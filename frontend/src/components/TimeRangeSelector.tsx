import type { TimeRange } from '../types'

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

const options: { value: TimeRange; label: string }[] = [
  { value: 'short_term', label: '4 Weeks' },
  { value: 'medium_term', label: '6 Months' },
  { value: 'long_term', label: 'All Time' },
]

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            value === opt.value
              ? 'bg-spotify-green text-black'
              : 'bg-spotify-gray text-spotify-light hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
