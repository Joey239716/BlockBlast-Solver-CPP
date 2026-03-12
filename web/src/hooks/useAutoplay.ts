import { useState, useEffect, useRef, useCallback } from 'react'

interface UseAutoplayReturn {
  isPlaying: boolean
  toggle:    () => void
  stop:      () => void
}

/**
 * Drives automatic step advancement.
 * @param onAdvance  Called each interval tick — caller decides what to do (advance or stop).
 * @param intervalMs Milliseconds between ticks (default 1 500ms).
 */
export function useAutoplay(
  onAdvance: () => void,
  intervalMs = 1_500,
): UseAutoplayReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const advanceRef = useRef(onAdvance)

  // Keep ref current without restarting interval
  useEffect(() => { advanceRef.current = onAdvance }, [onAdvance])

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => advanceRef.current(), intervalMs)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, intervalMs])

  const toggle = useCallback(() => setIsPlaying(v => !v), [])
  const stop   = useCallback(() => setIsPlaying(false), [])

  return { isPlaying, toggle, stop }
}
