import { cn } from '../../lib/utils'

const VARIANTS = {
  default: 'bg-[#21262D] text-[#8B949E] border-[#30363D]',
  blue:    'bg-accent-blue/12 text-accent-blue border-accent-blue/25',
  purple:  'bg-[#d4d4d4]/12 text-[#d4d4d4] border-[#d4d4d4]/25',
  green:   'bg-accent-green/12 text-accent-green border-accent-green/25',
  yellow:  'bg-[#a3a3a3]/12 text-[#a3a3a3] border-[#a3a3a3]/25',
  orange:  'bg-[#d4d4d4]/12 text-[#d4d4d4] border-[#d4d4d4]/25',
  red:     'bg-[#a3a3a3]/12 text-[#a3a3a3] border-[#a3a3a3]/25',
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
