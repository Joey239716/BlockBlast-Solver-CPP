import { useState, useCallback } from 'react'

interface UseAutoplayReturn {
  playing: boolean
  toggle:  () => void
  stop:    () => void
}

/**
 * Tracks play/pause state only.
 * Advancement is event-driven — caller calls advance() inside onDone.
 */
export function useAutoplay(): UseAutoplayReturn {
  const [playing, setPlaying] = useState(false)
  const toggle = useCallback(() => setPlaying(v => !v), [])
  const stop   = useCallback(() => setPlaying(false),   [])
  return { playing, toggle, stop }
}
