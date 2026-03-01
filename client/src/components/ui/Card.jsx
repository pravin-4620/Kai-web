import { cn } from '../../lib/utils'

export default function Card({ children, className, hover = false, glow = false, onClick, padding = true, ...props }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'card',
        padding && 'p-5',
        hover && 'card-hover',
        glow && 'shadow-glow',
        onClick && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-base font-semibold text-[#E6EDF3] tracking-tight', className)}>
      {children}
    </h3>
  )
}

export function CardBody({ children, className }) {
  return <div className={cn('', className)}>{children}</div>
}

export function CardFooter({ children, className }) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-[#30363D] flex items-center justify-between', className)}>
      {children}
    </div>
  )
}
