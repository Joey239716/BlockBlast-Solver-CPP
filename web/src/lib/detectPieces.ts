/**
 * detectPieces.ts
 *
 * OpenCV-based tray piece detection.
 * Uses Most Frequent Color subtraction + Shadow Filtering.
 * Fix: Adds a targeted "White Bypass" to prevent bright pieces from being erased.
 */

import type { Point } from '@/types/solver'
import { normalizePiece } from '@/lib/pieces'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runDetectPieces(
  cv: any,
  src: any,
  imageData: ImageData,
  canvas: HTMLCanvasElement | null,
  offX: number,
  offY: number,
  debugCanvas?: HTMLCanvasElement,
  cellSize?: number,
): (Point[] | null)[] {
  const ctx = canvas?.getContext('2d') ?? null

  // ── Tunable parameters ──────────────────────────────────────────────────────
  const TRAY_SCALE  = 0.43
  const SLICE_TOP   = 0.65
  const SLICE_BOT   = 0.85
  const MIN_AREA    = 400

  const SENSITIVITY = 0.7 

  const S_MIN = Math.round(60 - (SENSITIVITY * 40)) 
  const V_MIN = Math.round(60 - (SENSITIVITY * 40)) 
  const H_TOL = Math.round(25 - (SENSITIVITY * 15)) 
  const S_TOL = Math.round(50 - (SENSITIVITY * 30)) 
  const V_TOL = Math.round(50 - (SENSITIVITY * 30))
  // ───────────────────────────────────────────────────────────────────────────

  const cs = (cellSize ?? (imageData.height * 0.45 / 8)) * TRAY_SCALE
  const startY     = Math.round(src.rows * SLICE_TOP)
  const endY       = Math.round(src.rows * SLICE_BOT)
  const scanHeight = endY - startY

  const dockROI    = new cv.Mat(), rgb = new cv.Mat(), hsv = new cv.Mat()
  const mask       = new cv.Mat(), cleaned = new cv.Mat(), rgbaMask = new cv.Mat()
  const lowBG      = new cv.Mat(), highBG  = new cv.Mat()
  const isNotBG    = new cv.Mat(), isColorful = new cv.Mat(), isBrightWhite = new cv.Mat()
  const lowColor   = new cv.Mat(), highColor  = new cv.Mat()
  const lowWhite   = new cv.Mat(), highWhite  = new cv.Mat()
  const contours   = new cv.MatVector(), hierarchy = new cv.Mat()
  const slots: (Point[] | null)[] = [null, null, null]

  try {
    src.roi(new cv.Rect(0, startY, src.cols, scanHeight)).copyTo(dockROI)
    cv.cvtColor(dockROI, rgb, cv.COLOR_RGBA2RGB)
    cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV)

    // 1. Adaptive Background Subtraction (The working logic)
    const bgMean = cv.mean(hsv)
    lowBG.create(hsv.rows, hsv.cols, hsv.type())
    lowBG.setTo(new cv.Scalar(Math.max(0, bgMean[0]-H_TOL), Math.max(0, bgMean[1]-S_TOL), Math.max(0, bgMean[2]-V_TOL), 0))
    highBG.create(hsv.rows, hsv.cols, hsv.type())
    highBG.setTo(new cv.Scalar(Math.min(180, bgMean[0]+H_TOL), Math.min(255, bgMean[1]+S_TOL), Math.min(255, bgMean[2]+V_TOL), 0))

    cv.inRange(hsv, lowBG, highBG, isNotBG)
    cv.bitwise_not(isNotBG, isNotBG) 

    // 2. Standard Color Filter
    lowColor.create(hsv.rows, hsv.cols, hsv.type())
    lowColor.setTo(new cv.Scalar(0, S_MIN, V_MIN, 0))
    highColor.create(hsv.rows, hsv.cols, hsv.type())
    highColor.setTo(new cv.Scalar(180, 255, 255, 0))
    cv.inRange(hsv, lowColor, highColor, isColorful)

    // Base Mask (Colorful objects that aren't the background)
    cv.bitwise_and(isNotBG, isColorful, mask)

    // 3. WHITE PIECE BYPASS (The Fix)
    // If it's very bright (V > 200) and low saturation (S < 60), it's a white piece.
    lowWhite.create(hsv.rows, hsv.cols, hsv.type()); lowWhite.setTo(new cv.Scalar(0, 0, 200, 0))
    highWhite.create(hsv.rows, hsv.cols, hsv.type()); highWhite.setTo(new cv.Scalar(180, 60, 255, 0))
    cv.inRange(hsv, lowWhite, highWhite, isBrightWhite)
    
    // Add the white piece pixels into the mask regardless of background subtraction
    cv.bitwise_or(mask, isBrightWhite, mask)

    // 4. MORPHOLOGICAL CLOSING
    const morphKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(11, 11))
    cv.morphologyEx(mask, cleaned, cv.MORPH_CLOSE, morphKernel)
    morphKernel.delete()

    // 5. Debug Visualization
    cv.cvtColor(cleaned, rgbaMask, cv.COLOR_GRAY2RGBA)
    const maskImgData = new ImageData(new Uint8ClampedArray(rgbaMask.data), rgbaMask.cols, rgbaMask.rows)
    if (debugCanvas) {
      debugCanvas.width = rgbaMask.cols; debugCanvas.height = rgbaMask.rows
      debugCanvas.getContext('2d')!.putImageData(maskImgData, 0, 0)
    }

    const drawYStart = offY + Math.round(imageData.height * SLICE_TOP)
    if (ctx) {
      ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = '#000'; ctx.fillRect(offX, drawYStart, cleaned.cols, cleaned.rows); ctx.restore()
      const tmpCanvas = document.createElement('canvas'); tmpCanvas.width = rgbaMask.cols; tmpCanvas.height = rgbaMask.rows
      tmpCanvas.getContext('2d')!.putImageData(maskImgData, 0, 0)
      ctx.save(); ctx.globalAlpha = 0.6; ctx.drawImage(tmpCanvas, offX, drawYStart); ctx.restore()
    }

    // 6. Contours and Grid Logic
    cv.findContours(cleaned, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i)
      if (cv.contourArea(cnt) >= MIN_AREA) {
        const b = cv.boundingRect(cnt)
        const canvasX = offX + b.x, canvasY = drawYStart + b.y
        const cols = Math.max(1, Math.round(b.width / cs))
        const rows = Math.max(1, Math.round(b.height / cs))

        if (ctx) { ctx.strokeStyle = 'rgba(255, 220, 0, 0.9)'; ctx.lineWidth = 2; ctx.strokeRect(canvasX, canvasY, b.width, b.height) }

        const shape: Point[] = []
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const maskX = Math.min(cleaned.cols - 1, Math.max(0, Math.round(b.x + (c + 0.5) * cs)))
            const maskY = Math.min(cleaned.rows - 1, Math.max(0, Math.round(b.y + (r + 0.5) * cs)))

            let whiteCount = 0
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const py = Math.min(cleaned.rows - 1, Math.max(0, maskY + dy))
                const px = Math.min(cleaned.cols - 1, Math.max(0, maskX + dx))
                if (cleaned.data[py * cleaned.cols + px] > 127) whiteCount++
              }
            }
            const filled = whiteCount > 4
            if (filled) shape.push({ x: c, y: r })

            if (ctx) {
              const dotX = canvasX + (c + 0.5) * cs, dotY = canvasY + (r + 0.5) * cs
              ctx.beginPath(); ctx.arc(dotX, dotY, 3, 0, Math.PI * 2)
              if (filled) { ctx.fillStyle = 'rgba(0, 255, 0, 1)'; ctx.fill() }
              else { ctx.strokeStyle = 'rgba(255, 50, 50, 0.9)'; ctx.lineWidth = 1.5; ctx.stroke() }
            }
          }
        }
        if (ctx) { ctx.font = 'bold 10px monospace'; ctx.fillStyle = '#fff'; ctx.fillText(`${b.width}x${b.height}px ${cols}x${rows}U`, canvasX, canvasY - 5) }

        // Compact: remove phantom empty rows/cols caused by kernel bleed on the bounding box
        const filledYs = [...new Set(shape.map(p => p.y))].sort((a, b) => a - b)
        const filledXs = [...new Set(shape.map(p => p.x))].sort((a, b) => a - b)
        const yMap = new Map(filledYs.map((y, i) => [y, i]))
        const xMap = new Map(filledXs.map((x, i) => [x, i]))
        const compact = shape.map(p => ({ x: xMap.get(p.x)!, y: yMap.get(p.y)! }))

        // Assign to slot by x-centre of bounding box
        const slot = Math.min(2, Math.floor((b.x + b.width / 2) / (cleaned.cols / 3)))
        if (compact.length > 0) slots[slot] = normalizePiece(compact)
      }
      cnt.delete()
    }
  } catch (err) { console.error('[detectPieces] error:', err) }
  finally {
    dockROI.delete(); rgb.delete(); hsv.delete(); mask.delete(); cleaned.delete()
    rgbaMask.delete(); lowBG.delete(); highBG.delete(); isNotBG.delete(); isColorful.delete()
    isBrightWhite.delete(); lowColor.delete(); highColor.delete(); lowWhite.delete(); highWhite.delete()
    contours.delete(); hierarchy.delete()
  }
  return slots
}