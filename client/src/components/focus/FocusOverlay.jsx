import { useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Shield } from 'lucide-react'
import FocusContext from '../../context/FocusContext'

export default function FocusOverlay() {
  const { isActive, violationCount, warning, autoSubmit } = useContext(FocusContext)

  return (
    <AnimatePresence>
      {warning && (
        <motion.div
          key="warning"
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-full mx-4"
        >
          <div className="glass-card border-yellow-500/50 bg-yellow-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-amber-600">Focus Violation #{violationCount}</p>
                <p className="text-xs text-yellow-400 mt-0.5">
                  {autoSubmit
                    ? 'Maximum violations reached. Your test will auto-submit.'
                    : `Stay on the test window. ${3 - violationCount} warning(s) remaining.`}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {isActive && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 pointer-events-none">
          <Shield size={12} className="text-green-400" />
          <span className="text-xs text-green-400 font-medium">Focus Mode Active</span>
        </div>
      )}
    </AnimatePresence>
  )
}
