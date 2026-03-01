import { cn } from '../../lib/utils'

const COLOR_MAP = {
  blue:   { bar: 'bg-[#4F8EF7]', text: 'text-[#4F8EF7]' },
  purple: { bar: 'bg-[#8B5CF6]', text: 'text-[#8B5CF6]' },
  green:  { bar: 'bg-[#3FB950]', text: 'text-[#3FB950]' },
  yellow: { bar: 'bg-[#FBBF24]', text: 'text-[#FBBF24]' },
  orange: { bar: 'bg-[#FB8F44]', text: 'text-[#FB8F44]' },
  red:    { bar: 'bg-[#F85149]', text: 'text-[#F85149]' },
  cyan:   { bar: 'bg-[#22D3EE]', text: 'text-[#22D3EE]' },
  default:{ bar: 'bg-[#4F8EF7]', text: 'text-[#4F8EF7]' },
}

export default function Progress({ value = 0, max = 100, label, showLabel = false, color = 'default', size = 'sm', className }) {
  const safeMax = Number(max) > 0 ? Number(max) : 100
  const percent = (Number(value) / safeMax) * 100
  const clamped = Math.min(100, Math.max(0, Number.isFinite(percent) ? percent : 0))
  const { bar, text } = COLOR_MAP[color] || COLOR_MAP.default
  const trackH = size === 'lg' ? 'h-2.5' : 'h-1.5'

  return (
    <div className={cn('w-full', className)}>
      {(label || showLabel) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-[#8B949E]">{label}</span>}
          {showLabel && (
            <span className={cn('text-xs font-semibold tabular-nums', text)}>
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-[#21262D] rounded-full overflow-hidden', trackH)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', bar)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
