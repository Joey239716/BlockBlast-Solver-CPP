import { useCallback, useEffect, useRef, useState } from 'react'
import type { Point } from '@/types/solver'
import { useOpenCV } from './useOpenCV'
import { detectBoardOnly } from '@/lib/detectGameState'
import { runDetectPieces } from '@/lib/detectPieces'
import { getYoloSession, runYoloBoard } from '@/lib/yoloDetect'
import type { InferenceSession } from 'onnxruntime-web'

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBoardDetection(
  onGameStateLoaded: (board: boolean[][], pieces: (Point[] | null)[]) => void,
  onStatusChange: (status: string) => void,
) {
  const { cv, ready, progress } = useOpenCV()
  const [processing, setProcessing] = useState(false)
  const yoloRef = useRef<InferenceSession | null>(null)
  const [yoloReady, setYoloReady] = useState(false)

  useEffect(() => {
    getYoloSession()
      .then(s => { yoloRef.current = s; setYoloReady(true) })
      .catch(() => { setYoloReady(true) }) // failed to load — proceed without YOLO
  }, [])

  const detect = useCallback(async (file: File) => {
    if (!ready || !cv) return
    setProcessing(true)
    onStatusChange('Processing…')

    try {
      const bitmap = await createImageBitmap(file)
      const scale  = Math.min(1, 1200 / bitmap.width, 1200 / bitmap.height)
      const w      = Math.max(1, Math.round(bitmap.width  * scale))
      const h      = Math.max(1, Math.round(bitmap.height * scale))

      const off    = document.createElement('canvas')
      off.width = w; off.height = h
      const offCtx = off.getContext('2d', { willReadFrequently: true })!
      offCtx.drawImage(bitmap, 0, 0, w, h)
      const imageData = offCtx.getImageData(0, 0, w, h)

      const src = cv.matFromImageData(imageData)
      try {
        let boardHint: { x: number; y: number; width: number; height: number } | undefined
        if (yoloRef.current) {
          // YOLO is the primary board locator — if it finds nothing, stop
          const box = await runYoloBoard(yoloRef.current, imageData)
          if (!box) {
            onStatusChange('No board found — try a clearer screenshot')
            return
          }
          boardHint = { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) }
        }
        // boardHint is undefined only if YOLO failed to load → Canny runs as last resort
        const boardResult = detectBoardOnly(cv, src, imageData, boardHint)
        if (!boardResult) {
          onStatusChange('No board found — try a clearer screenshot')
          return
        }
        const pieces      = runDetectPieces(cv, src, imageData, null, 0, 0, undefined, boardResult.cellSize)
        const filled      = boardResult.board.flat().filter(Boolean).length
        const piecesFound = pieces.filter(Boolean).length
        onGameStateLoaded(boardResult.board, pieces)
        onStatusChange(`Board detected — ${filled}/64 cells  |  ${piecesFound}/3 pieces found`)
      } finally {
        src.delete()
      }
    } catch (err) {
      onStatusChange(`Error: ${String(err)}`)
    } finally {
      setProcessing(false)
    }
  }, [cv, ready, onGameStateLoaded, onStatusChange])

  return { ready: ready && yoloReady, progress, processing, detect }
}
