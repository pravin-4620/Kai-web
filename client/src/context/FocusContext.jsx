import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { ls } from '../lib/utils'

const FocusContext = createContext(null)

export function FocusProvider({ children }) {
  const [isActive,       setIsActive]       = useState(false)
  const [violations,     setViolations]      = useState(0)
  const [showWarning,    setShowWarning]     = useState(false)
  const [warningMessage, setWarningMessage]  = useState('')
  const [sessionId,      setSessionId]       = useState(null)
  const [autoSubmit,     setAutoSubmit]      = useState(false)

  const listenerRefs = useRef({})

  const MAX_VIOLATIONS = 3

  const triggerWarning = useCallback((msg) => {
    setWarningMessage(msg)
    setShowWarning(true)
  }, [])

  const dismissWarning = useCallback(() => {
    setShowWarning(false)
  }, [])

  const logViolation = useCallback((type) => {
    setViolations((prev) => {
      const next = prev + 1
      if (next >= MAX_VIOLATIONS) {
        setAutoSubmit(true)
        triggerWarning('Maximum violations reached. Your test has been auto-submitted.')
      } else {
        triggerWarning(`KAI detected suspicious activity (${type}). ${MAX_VIOLATIONS - next} warning(s) remaining.`)
      }
      return next
    })
  }, [triggerWarning])

  const startFocus = useCallback((sid = null) => {
    setIsActive(true)
    setViolations(0)
    setAutoSubmit(false)
    setSessionId(sid)
    ls.set('kai_focus_active', true)
    ls.set('kai_focus_session', sid)

    // Request fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {})
    }

    // Visibility change handler
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        logViolation('tab_switch')
      }
    }

    // Window blur handler
    const onBlur = () => logViolation('window_blur')

    // Context menu disable
    const onContextMenu = (e) => e.preventDefault()

    // Copy disable
    const onCopy = (e) => e.preventDefault()

    // Fullscreen change
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerWarning('Fullscreen exited. Please stay in fullscreen during the test.')
        setTimeout(() => {
          document.documentElement.requestFullscreen?.().catch(() => {})
        }, 500)
      }
    }

    // Escape key block
    const onKeyDown = (e) => {
      if (e.key === 'Escape') e.preventDefault()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('copy', onCopy)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('keydown', onKeyDown)

    listenerRefs.current = { onVisibilityChange, onBlur, onContextMenu, onCopy, onFullscreenChange, onKeyDown }
  }, [logViolation, triggerWarning])

  const stopFocus = useCallback(() => {
    setIsActive(false)
    setAutoSubmit(false)
    ls.remove('kai_focus_active')
    ls.remove('kai_focus_session')

    // Remove all listeners
    const l = listenerRefs.current
    document.removeEventListener('visibilitychange', l.onVisibilityChange)
    window.removeEventListener('blur', l.onBlur)
    document.removeEventListener('contextmenu', l.onContextMenu)
    document.removeEventListener('copy', l.onCopy)
    document.removeEventListener('fullscreenchange', l.onFullscreenChange)
    document.removeEventListener('keydown', l.onKeyDown)

    // Exit fullscreen
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})

    listenerRefs.current = {}
  }, [])

  return (
    <FocusContext.Provider value={{
      isActive,
      violations,
      showWarning,
      warningMessage,
      sessionId,
      autoSubmit,
      startFocus,
      stopFocus,
      logViolation,
      dismissWarning,
      triggerWarning,
      MAX_VIOLATIONS,
    }}>
      {children}
    </FocusContext.Provider>
  )
}

export function useFocusContext() {
  const ctx = useContext(FocusContext)
  if (!ctx) throw new Error('useFocusContext must be used within FocusProvider')
  return ctx
}

export default FocusContext
