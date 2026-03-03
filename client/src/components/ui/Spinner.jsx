import { cn } from '../../lib/utils'

export default function Spinner({ size = 'md', className }) {
  const sz = size === 'sm' ? 'w-4 h-4 border-[2px]' : size === 'lg' ? 'w-8 h-8 border-[3px]' : 'w-5 h-5 border-[2px]'
  return (
    <div className={cn(
      'rounded-full border-[#30363D] border-t-accent-blue animate-spin',
      sz, className
    )} />
  )
}
