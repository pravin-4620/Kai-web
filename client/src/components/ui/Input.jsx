import { cn } from '../../lib/utils'

export default function Input({
  label, error, helper, leftIcon, rightIcon,
  className, wrapperClassName, inputClassName, ...props
}) {
  return (
    <div className={cn('w-full', className, wrapperClassName)}>
      {label && (
        <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-3 flex items-center text-[#484F58]">
            {leftIcon}
          </div>
        )}
        <input
          className={cn(
            'input-field',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            error && 'border-[#F85149] focus:border-[#F85149] focus:ring-[#F85149]/20',
            inputClassName
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-3 flex items-center text-[#484F58]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-[#F85149]">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-[#8B949E]">{helper}</p>}
    </div>
  )
}

export function Textarea({
  label,
  error,
  helper,
  className,
  wrapperClassName,
  inputClassName,
  rows = 4,
  ...props
}) {
  return (
    <div className={cn('w-full', className, wrapperClassName)}>
      {label && (
        <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={cn(
          'input-field resize-y min-h-[100px]',
          error && 'border-[#F85149] focus:border-[#F85149] focus:ring-[#F85149]/20',
          inputClassName
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-[#F85149]">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-[#8B949E]">{helper}</p>}
    </div>
  )
}
