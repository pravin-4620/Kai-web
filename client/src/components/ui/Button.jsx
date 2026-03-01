import { cn } from '../../lib/utils'
import Spinner from './Spinner'

const VARIANTS = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
}

const SIZES = {
  xs: 'px-2.5 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: '',
  lg: 'px-5 py-2.5 text-base rounded-xl',
  xl: 'px-6 py-3 text-base rounded-xl font-bold',
  icon: 'w-9 h-9 p-0 rounded-lg',
}

export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false,
  leftIcon, rightIcon, className, onClick, type = 'button', ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size],
        'relative inline-flex items-center justify-center gap-2',
        className
      )}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" />
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  )
}
