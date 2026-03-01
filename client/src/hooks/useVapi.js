import { useState, useEffect, useRef, useCallback } from 'react'

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY

export default function useVapi() {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState([])
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [callDuration, setCallDuration] = useState(0)
  const vapiRef = useRef(null)
  const timerRef = useRef(null)
  const transcriptRef = useRef([])

  useEffect(() => {
    let vapi = null

    const initVapi = async () => {
      if (!VAPI_PUBLIC_KEY) return
      try {
        const { default: Vapi } = await import('@vapi-ai/web')
        vapi = new Vapi(VAPI_PUBLIC_KEY)
        vapiRef.current = vapi

        vapi.on('call-start', () => {
          setIsCallActive(true)
          setIsConnecting(false)
          timerRef.current = setInterval(() => {
            setCallDuration(d => d + 1)
          }, 1000)
        })

        vapi.on('call-end', () => {
          setIsCallActive(false)
          setIsSpeaking(false)
          setIsConnecting(false)
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
        })

        vapi.on('speech-start', () => setIsSpeaking(true))
        vapi.on('speech-end', () => setIsSpeaking(false))
        vapi.on('volume-level', (level) => setVolumeLevel(level))

        vapi.on('message', (msg) => {
          if (msg.type === 'transcript' && msg.transcriptType === 'final' && msg.transcript?.trim()) {
            const entry = {
              role: msg.role === 'assistant' ? 'interviewer' : 'user',
              content: msg.transcript.trim(),
              timestamp: new Date().toISOString(),
            }
            transcriptRef.current = [...transcriptRef.current, entry]
            setTranscript([...transcriptRef.current])
          }
        })

        vapi.on('error', (err) => {
          console.error('Vapi error:', err)
          setIsConnecting(false)
        })
      } catch (err) {
        console.error('Failed to init Vapi:', err)
      }
    }

    initVapi()

    return () => {
      if (vapi) vapi.stop()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startCall = useCallback(async (assistantId, overrides) => {
    if (!vapiRef.current) throw new Error('Vapi not initialised — check VITE_VAPI_PUBLIC_KEY')
    setIsConnecting(true)
    setTranscript([])
    transcriptRef.current = []
    setCallDuration(0)
    setIsMuted(false)
    try {
      await vapiRef.current.start(assistantId, overrides)
    } catch (err) {
      setIsConnecting(false)
      throw err
    }
  }, [])

  const stopCall = useCallback(async () => {
    try { await vapiRef.current?.stop() } catch { /* ignore */ }
  }, [])

  const toggleMute = useCallback(() => {
    if (!vapiRef.current) return
    try {
      const next = !isMuted
      vapiRef.current.setMuted(next)
      setIsMuted(next)
    } catch { /* call not active — ignore */ }
  }, [isMuted])

  return {
    isCallActive,
    isConnecting,
    isMuted,
    isSpeaking,
    transcript,
    volumeLevel,
    callDuration,
    startCall,
    stopCall,
    toggleMute,
    isAvailable: !!VAPI_PUBLIC_KEY,
  }
}
