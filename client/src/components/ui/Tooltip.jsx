import { useState } from 'react'
import { cn } from '../../lib/utils'

export default function Tooltip({ content, children, side = 'top', className }) {
  const [visible, setVisible] = useState(false)
  if (!content) return <>{children}</>

  const posClass = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full  left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full  top-1/2 -translate-y-1/2 ml-2',
  }[side] || 'bottom-full left-1/2 -translate-x-1/2 mb-2'

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={cn(
          'absolute z-50 px-2.5 py-1 bg-[#21262D] text-[#E6EDF3] text-xs font-medium',
          'rounded-md border border-[#30363D] shadow-modal whitespace-nowrap pointer-events-none',
          posClass, className
        )}>
          {content}
        </div>
      )}
    </div>
  )
}
