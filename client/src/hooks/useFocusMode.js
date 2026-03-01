import { useFocusContext } from '../context/FocusContext'
import { codingApi } from '../lib/api'
import { useCallback } from 'react'

export function useFocusMode() {
  const {
    isActive, violations, showWarning, warningMessage,
    autoSubmit, startFocus, stopFocus, logViolation,
    dismissWarning, triggerWarning, MAX_VIOLATIONS,
  } = useFocusContext()

  // Check for DevTools open (heuristic)
  const detectDevTools = useCallback(() => {
    const threshold = 160
    return window.outerWidth - window.innerWidth > threshold ||
           window.outerHeight - window.innerHeight > threshold
  }, [])

  const enterFocusMode = useCallback(async (sessionId) => {
    if (detectDevTools()) {
      triggerWarning('Developer tools detected. Please close them to continue.')
      return false
    }
    startFocus(sessionId)
    return true
  }, [startFocus, detectDevTools, triggerWarning])

  const exitFocusMode = useCallback(() => {
    stopFocus()
  }, [stopFocus])

  const reportViolation = useCallback(async (type, testId) => {
    logViolation(type)
    if (testId) {
      try {
        await codingApi.logViolation({ testId, type, timestamp: new Date().toISOString() })
      } catch { /* silent */ }
    }
  }, [logViolation])

  return {
    isActive,
    violations,
    showWarning,
    warningMessage,
    autoSubmit,
    MAX_VIOLATIONS,
    enterFocusMode,
    exitFocusMode,
    reportViolation,
    dismissWarning,
    detectDevTools,
  }
}
