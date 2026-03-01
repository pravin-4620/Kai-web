import { cn } from '../../lib/utils'

export default function Skeleton({ className, ...props }) {
  return (
    <div className={cn('skeleton', className)} {...props} />
  )
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-2 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-2 w-4/5" />
    </div>
  )
}

export function SkeletonLine({ className }) {
  return <Skeleton className={cn('h-3 rounded', className)} />
}
