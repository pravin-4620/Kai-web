import { cn } from '../../lib/utils'

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

const SIZE = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base',
}

export default function Avatar({ src, name, size = 'md', className }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'avatar'}
        className={cn('rounded-full object-cover flex-shrink-0 ring-1 ring-[#30363D]', SIZE[size] || SIZE.md, className)}
      />
    )
  }
  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
      'bg-gradient-to-br from-[#4F8EF7] to-[#8B5CF6] text-white ring-1 ring-[#30363D]',
      SIZE[size] || SIZE.md, className
    )}>
      {initials(name)}
    </div>
  )
}
