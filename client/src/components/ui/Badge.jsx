import { cn } from '../../lib/utils'

const VARIANTS = {
  default: 'bg-[#21262D] text-[#8B949E] border-[#30363D]',
  blue:    'bg-[#4F8EF7]/12 text-[#4F8EF7] border-[#4F8EF7]/25',
  purple:  'bg-[#8B5CF6]/12 text-[#8B5CF6] border-[#8B5CF6]/25',
  green:   'bg-[#3FB950]/12 text-[#3FB950] border-[#3FB950]/25',
  yellow:  'bg-[#FBBF24]/12 text-[#FBBF24] border-[#FBBF24]/25',
  orange:  'bg-[#FB8F44]/12 text-[#FB8F44] border-[#FB8F44]/25',
  red:     'bg-[#F85149]/12 text-[#F85149] border-[#F85149]/25',
  cyan:    'bg-[#22D3EE]/12 text-[#22D3EE] border-[#22D3EE]/25',
}

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
      VARIANTS[variant] || VARIANTS.default,
      className
    )}>
      {children}
    </span>
  )
}
