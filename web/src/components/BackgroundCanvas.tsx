import { useEffect, useRef } from 'react'

const KATAKANA = 'ァアィイゥウェエォオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
const RAIN_CHARS = KATAKANA + '0123456789!@#$%^&*'
const GLITCH_CHARS = '01░▓·×+XzZ@#$%&*'

function isMobileWidth() {
  return window.innerWidth < 768
}

// ─── Matrix Rain ──────────────────────────────────────────────────────────────

function startRain(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')!

  let drops: number[] = []
  let speeds: number[] = []
  let animId = 0
  let lastTime = 0

  function resize() {
    const mobile = isMobileWidth()
    const fontSize = mobile ? 10 : 13
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    const numCols = Math.floor(canvas.width / fontSize)
    drops  = Array.from({ length: numCols }, () => Math.random() * -80)
    speeds = Array.from({ length: numCols }, () => 0.25 + Math.random() * 0.65)
  }

  resize()
  window.addEventListener('resize', resize)

  function draw(time: number) {
    animId = requestAnimationFrame(draw)
    if (document.visibilityState === 'hidden') return

    const delta = Math.min(time - lastTime, 50) // clamp spikes
    lastTime = time

    const mobile   = isMobileWidth()
    const fontSize = mobile ? 10 : 13

    // Fade existing content toward bg color
    ctx.fillStyle = 'rgba(8, 8, 16, 0.055)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.font = `${fontSize}px monospace`

    for (let i = 0; i < drops.length; i++) {
      const char = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)]
      const x    = i * fontSize
      const y    = Math.floor(drops[i]) * fontSize

      if (y > 0 && y < canvas.height + fontSize) {
        // Bright white-cyan tip — this frame's character is always the "head"
        ctx.fillStyle = 'rgba(190, 245, 255, 0.92)'
        ctx.fillText(char, x, y)
      }

      drops[i] += speeds[i] * (delta / 16.67)

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i]   = Math.random() * -50
        speeds[i]  = 0.25 + Math.random() * 0.65
      }
    }
  }

  animId = requestAnimationFrame(draw)

  return () => {
    cancelAnimationFrame(animId)
    window.removeEventListener('resize', resize)
  }
}

// ─── ASCII Glitch Grid ────────────────────────────────────────────────────────

function startGlitch(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')!

  let grid: string[][] = []
  let cols = 0
  let rows = 0
  let intervalId = 0

  function buildGrid() {
    const mobile   = isMobileWidth()
    const fontSize = mobile ? 10 : 12
    canvas.width   = window.innerWidth
    canvas.height  = window.innerHeight

    // Measure real char width for consistent spacing
    ctx.font = `${fontSize}px monospace`
    const charW = ctx.measureText('0').width
    const charH = fontSize * 1.4

    cols = Math.ceil(canvas.width  / charW)
    rows = Math.ceil(canvas.height / charH)

    grid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () =>
        GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)],
      ),
    )

    drawGrid()
  }

  function drawGrid() {
    const mobile   = isMobileWidth()
    const fontSize = mobile ? 10 : 12
    const opacity  = mobile ? 0.056 : 0.08

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.font      = `${fontSize}px monospace`
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

    const charW = ctx.measureText('0').width
    const charH = fontSize * 1.4

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillText(grid[r][c], c * charW, r * charH + fontSize)
      }
    }
  }

  buildGrid()
  window.addEventListener('resize', buildGrid)

  function tick() {
    if (document.visibilityState === 'hidden') return
    const totalCells = rows * cols
    const pct        = 0.02 + Math.random() * 0.02 // 2–4 %
    const numChanges = Math.max(1, Math.floor(totalCells * pct))

    for (let i = 0; i < numChanges; i++) {
      const r = Math.floor(Math.random() * rows)
      const c = Math.floor(Math.random() * cols)
      grid[r][c] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
    }

    drawGrid()
  }

  // Randomize the next interval each tick for organic feel
  function scheduleNext() {
    intervalId = window.setTimeout(() => {
      tick()
      scheduleNext()
    }, 100 + Math.random() * 100)
  }
  scheduleNext()

  return () => {
    clearTimeout(intervalId)
    window.removeEventListener('resize', buildGrid)
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BackgroundCanvas() {
  const rainRef   = useRef<HTMLCanvasElement>(null)
  const glitchRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!rainRef.current) return
    return startRain(rainRef.current)
  }, [])

  useEffect(() => {
    if (!glitchRef.current) return
    return startGlitch(glitchRef.current)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* Layer 1 — Matrix rain */}
      {/*
      <canvas
        ref={rainRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.15 }}
      />*/}

      {/* Layer 2 — ASCII glitch grid */}
      <canvas
        ref={glitchRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Vignette — draws eye to center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 25%, rgba(20, 20, 25, 0.55) 70%, rgba(5, 5, 10, 0.85) 100%)',
        }}
      />
    </div>
  )
}
