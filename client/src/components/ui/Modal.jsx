import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function Modal({ open, isOpen, onClose, title, children, className, size = 'md' }) {
  const visible = typeof open === 'boolean' ? open : !!isOpen

  useEffect(() => {
    if (visible) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [visible])

  const WIDTH = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' }

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', duration: 0.2, bounce: 0 }}
            className={cn(
              'relative w-full bg-[#161B22] border border-[#30363D] rounded-2xl shadow-modal z-10',
              WIDTH[size] || WIDTH.md,
              className
            )}
          >
            {(title || onClose) && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363D]">
                {title && <h3 className="text-base font-semibold text-[#E6EDF3]">{title}</h3>}
                {onClose && (
                  <button
                    onClick={onClose}
                    className="ml-auto p-1.5 rounded-lg text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#21262D] transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
