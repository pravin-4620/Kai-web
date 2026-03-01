import { useState, useEffect, useRef, useCallback } from 'react'
import { useFocusContext } from '../context/FocusContext'
import { codingApi } from '../lib/api'

export function useProctor({ testId, enabled = true } = {}) {
  const { isActive, violations, autoSubmit, logViolation } = useFocusContext()
  const [cameraStream, setCameraStream] = useState(null)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const videoRef = useRef(null)
  const violationLog = useRef([])

  // Request camera access (optional)
  const requestCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      setCameraStream(stream)
      setCameraEnabled(true)
      if (videoRef.current) videoRef.current.srcObject = stream
      return true
    } catch {
      return false
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop())
      setCameraStream(null)
      setCameraEnabled(false)
    }
  }, [cameraStream])

  // Check for suspicious browser extensions
  const checkExtensions = useCallback(() => {
    const suspiciousPlugins = Array.from(navigator.plugins || []).filter((p) =>
      /grammarly|darkreader|adblock|ublock/i.test(p.name)
    )
    return suspiciousPlugins.map((p) => p.name)
  }, [])

  // Log violation to backend
  const persistViolation = useCallback(async (type) => {
    const entry = { type, timestamp: new Date().toISOString() }
    violationLog.current.push(entry)
    logViolation(type)
    if (testId && enabled) {
      try {
        await codingApi.logViolation({ testId, ...entry })
      } catch { /* silent */ }
    }
  }, [testId, enabled, logViolation])

  // Clipboard events monitor
  useEffect(() => {
    if (!enabled || !isActive) return
    const onPaste = (e) => {
      persistViolation('paste_attempt')
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [enabled, isActive, persistViolation])

  // Clean up camera on unmount
  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  return {
    cameraEnabled,
    cameraStream,
    videoRef,
    violations,
    autoSubmit,
    violationLog: violationLog.current,
    requestCamera,
    stopCamera,
    checkExtensions,
    persistViolation,
  }
}
