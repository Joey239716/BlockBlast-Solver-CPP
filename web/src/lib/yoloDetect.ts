/**
 * yoloDetect.ts
 *
 * YOLOv11 inference for tray-piece detection.
 *
 * Model:    /best.onnx  (served from public/)
 * Input:    [1, 3, 640, 640] float32 — letterboxed, normalized 0-1, NCHW
 * Output:   output0 [1, 6, 8400] float32 — transposed YOLOv11 format
 *           Each detection: [cx, cy, w, h, score_class0, score_class1]
 *           Class 0: boards-pieces (ignore)
 *           Class 1: pieces (tray pieces — what we want)
 * NMS:      nms:False in model args — we run greedy NMS here
 */

import * as ort from 'onnxruntime-web/wasm'

// In production the wasm binary is served from public/ at the root.
// In dev, ort-web is served directly from node_modules (optimizeDeps.exclude)
// and finds its files relative to itself — no wasmPaths override needed.
if (import.meta.env.PROD) {
  ort.env.wasm.wasmPaths = '/'
}
ort.env.wasm.numThreads = 1   // avoid SharedArrayBuffer / COOP requirements

export interface YoloBox {
  x:      number   // top-left x in original image coords
  y:      number   // top-left y in original image coords
  width:  number
  height: number
  score:  number
}

// ─── Session loading ──────────────────────────────────────────────────────────

export async function loadYoloSession(): Promise<ort.InferenceSession> {
  return ort.InferenceSession.create('/best.onnx', {
    executionProviders: ['wasm'],
  })
}

/** Module-level singleton — loads once, shared across all callers. */
let _sessionPromise: Promise<ort.InferenceSession> | null = null
export function getYoloSession(): Promise<ort.InferenceSession> {
  if (!_sessionPromise) _sessionPromise = loadYoloSession()
  return _sessionPromise
}

// ─── Letterbox preprocessing ──────────────────────────────────────────────────

const MODEL_SIZE = 640

interface LetterboxResult {
  tensor: Float32Array
  scale:  number
  padX:   number
  padY:   number
}

function letterbox(imageData: ImageData): LetterboxResult {
  const { width: W, height: H } = imageData
  const scale = Math.min(MODEL_SIZE / W, MODEL_SIZE / H)
  const newW  = Math.round(W * scale)
  const newH  = Math.round(H * scale)
  const padX  = Math.floor((MODEL_SIZE - newW) / 2)
  const padY  = Math.floor((MODEL_SIZE - newH) / 2)

  // Draw source to a temp canvas, then draw letterboxed onto model canvas
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = W; srcCanvas.height = H
  srcCanvas.getContext('2d')!.putImageData(imageData, 0, 0)

  const canvas = document.createElement('canvas')
  canvas.width = MODEL_SIZE; canvas.height = MODEL_SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = 'rgb(114,114,114)'
  ctx.fillRect(0, 0, MODEL_SIZE, MODEL_SIZE)
  ctx.drawImage(srcCanvas, padX, padY, newW, newH)

  const lb = ctx.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE)
  const d  = lb.data
  const N  = MODEL_SIZE * MODEL_SIZE
  const tensor = new Float32Array(3 * N)
  for (let i = 0; i < N; i++) {
    tensor[i]         = d[i * 4]     / 255  // R
    tensor[N + i]     = d[i * 4 + 1] / 255  // G
    tensor[2 * N + i] = d[i * 4 + 2] / 255  // B
  }

  return { tensor, scale, padX, padY }
}

// ─── IoU + greedy NMS ─────────────────────────────────────────────────────────

function iou(a: YoloBox, b: YoloBox): number {
  const ax2 = a.x + a.width,  ay2 = a.y + a.height
  const bx2 = b.x + b.width,  by2 = b.y + b.height
  const ix  = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x))
  const iy  = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y))
  const inter = ix * iy
  const union = a.width * a.height + b.width * b.height - inter
  return union > 0 ? inter / union : 0
}

function nms(boxes: YoloBox[], iouThresh = 0.45): YoloBox[] {
  boxes.sort((a, b) => b.score - a.score)
  const kept       = new Array<YoloBox>()
  const suppressed = new Uint8Array(boxes.length)
  for (let i = 0; i < boxes.length; i++) {
    if (suppressed[i]) continue
    kept.push(boxes[i])
    for (let j = i + 1; j < boxes.length; j++) {
      if (!suppressed[j] && iou(boxes[i], boxes[j]) > iouThresh) suppressed[j] = 1
    }
  }
  return kept
}

// ─── Main inference function ──────────────────────────────────────────────────

/**
 * Run YOLOv11 inference, returning the best board bounding box (class 0).
 *
 * @param session    ort.InferenceSession from loadYoloSession()
 * @param imageData  Full screenshot ImageData (any size)
 * @param confThresh Minimum score for class 0 to keep a detection (default 0.25)
 */
export async function runYoloBoard(
  session:    ort.InferenceSession,
  imageData:  ImageData,
  confThresh  = 0.25,
): Promise<YoloBox | null> {
  const { tensor, scale, padX, padY } = letterbox(imageData)

  const inputTensor = new ort.Tensor('float32', tensor, [1, 3, MODEL_SIZE, MODEL_SIZE])
  const results     = await session.run({ [session.inputNames[0]]: inputTensor })
  const out         = results[session.outputNames[0]].data as Float32Array

  const NUM_DETS = 8400
  const boxes: YoloBox[] = []

  for (let i = 0; i < NUM_DETS; i++) {
    const s0 = out[4 * NUM_DETS + i]   // class 0 score (board)
    if (s0 < confThresh) continue

    const cx = out[0 * NUM_DETS + i]
    const cy = out[1 * NUM_DETS + i]
    const w  = out[2 * NUM_DETS + i]
    const h  = out[3 * NUM_DETS + i]

    boxes.push({
      x:      (cx - w / 2 - padX) / scale,
      y:      (cy - h / 2 - padY) / scale,
      width:  w / scale,
      height: h / scale,
      score:  s0,
    })
  }

  const after = nms(boxes)
  return after.length > 0 ? after[0] : null
}

/**
 * Run YOLOv11 inference, returning tray-piece bounding boxes (class 1 only)
 * sorted left-to-right by x coordinate, in original image pixel coordinates.
 *
 * @param session    ort.InferenceSession from loadYoloSession()
 * @param imageData  Full screenshot ImageData (any size)
 * @param confThresh Minimum score for class 1 to keep a detection (default 0.25)
 */
export async function runYoloPieces(
  session:    ort.InferenceSession,
  imageData:  ImageData,
  confThresh  = 0.25,
): Promise<YoloBox[]> {
  const { tensor, scale, padX, padY } = letterbox(imageData)

  const inputTensor = new ort.Tensor('float32', tensor, [1, 3, MODEL_SIZE, MODEL_SIZE])
  const results     = await session.run({ [session.inputNames[0]]: inputTensor })
  const out         = results[session.outputNames[0]].data as Float32Array

  // Output is [1, 6, 8400] — stored row-major as [6 * 8400]
  // Access: out[field * 8400 + i]
  const NUM_DETS = 8400
  const boxes: YoloBox[] = []

  for (let i = 0; i < NUM_DETS; i++) {
    const s1 = out[5 * NUM_DETS + i]   // class 1 score (tray pieces)
    if (s1 < confThresh) continue

    const cx = out[0 * NUM_DETS + i]
    const cy = out[1 * NUM_DETS + i]
    const w  = out[2 * NUM_DETS + i]
    const h  = out[3 * NUM_DETS + i]

    // Map from 640×640 letterbox space → original image space
    boxes.push({
      x:      (cx - w / 2 - padX) / scale,
      y:      (cy - h / 2 - padY) / scale,
      width:  w / scale,
      height: h / scale,
      score:  s1,
    })
  }

  const after = nms(boxes)
  // Sort left-to-right so slot 0 = leftmost piece
  after.sort((a, b) => a.x - b.x)
  return after
}
