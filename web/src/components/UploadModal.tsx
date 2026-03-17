import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  open:     boolean
  onClose:  () => void
  onFile:   (file: File) => void
}

const isMobile = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches

export function UploadModal({ open, onClose, onFile }: Props) {
  const cameraRef  = useRef<HTMLInputElement>(null)
  const filesRef   = useRef<HTMLInputElement>(null)
  const mobile     = isMobile()
  const [pasteError, setPasteError] = useState('')

  // Listen for paste events while modal is open
  useEffect(() => {
    if (!open) return
    function handlePaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
      if (!item) { setPasteError('No image found in clipboard.'); return }
      const file = item.getAsFile()
      if (!file) return
      setPasteError('')
      onClose()
      onFile(file)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [open, onClose, onFile])

  async function handleReadClipboard() {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const file = new File([blob], 'clipboard.png', { type: imageType })
          setPasteError('')
          onClose()
          onFile(file)
          return
        }
      }
      setPasteError('No image found in clipboard.')
    } catch {
      setPasteError('Clipboard access denied. Try Ctrl+V / ⌘V instead.')
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) { onClose(); onFile(file) }
  }

  return (
    <>
      {/* Hidden inputs */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={handleChange} />
      <input ref={filesRef}  type="file" accept="image/*"
        className="hidden" onChange={handleChange} />

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />

            {/* Card */}
            <motion.div
              className="fixed z-50 left-1/2 top-1/2 w-[min(360px,92vw)]"
              style={{ x: '-50%', y: '-50%' }}
              initial={{ opacity: 0, scale: 0.93, y: '-46%' }}
              animate={{ opacity: 1, scale: 1,    y: '-50%' }}
              exit={{   opacity: 0, scale: 0.93,  y: '-46%' }}
              transition={{ duration: 0.22, ease: [0.34, 1.2, 0.64, 1] }}
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: '#0f0f1e',
                  border:     '1px solid rgba(255,255,255,0.08)',
                  boxShadow:  '0 24px 64px rgba(0,0,0,0.6)',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                  <span className="text-[13px] font-semibold text-white/80">Upload Screenshot</span>
                  <button
                    onClick={onClose}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <CloseIcon />
                  </button>
                </div>

                {/* Options */}
                <div className="flex flex-col gap-3 p-4">
                  {/* Clipboard paste — prominent, shown first */}
                  <div className="flex flex-col gap-2">
                    <OptionButton
                      icon={<ClipboardIcon />}
                      label="Paste from Clipboard"
                      description={
                        <span>
                          Copy a screenshot first, then click here
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }}>
                            {/mac/i.test(navigator.userAgent) ? '⌘C' : 'Ctrl+C'}
                          </span>
                          {' '}or press{' '}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }}>
                            {/mac/i.test(navigator.userAgent) ? '⌘V' : 'Ctrl+V'}
                          </span>
                        </span>
                      }
                      onClick={handleReadClipboard}
                      accent
                    />
                    <AnimatePresence>
                      {pasteError && (
                        <motion.p
                          className="text-[11px] px-1"
                          style={{ color: 'rgba(255,100,100,0.8)' }}
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        >
                          {pasteError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>or</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  </div>

                  {mobile && (
                    <OptionButton
                      icon={<CameraIcon />}
                      label="Take Photo"
                      description="Use your camera"
                      onClick={() => cameraRef.current?.click()}
                    />
                  )}
                  <OptionButton
                    icon={<FolderIcon />}
                    label="Choose from Files"
                    description="Browse your photo library"
                    onClick={() => filesRef.current?.click()}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Option button ─────────────────────────────────────────────────────────────

function OptionButton({ icon, label, description, onClick, accent }: {
  icon:        React.ReactNode
  label:       string
  description: React.ReactNode
  onClick:     () => void
  accent?:     boolean
}) {
  const accentColor = accent ? 'rgba(252,238,9,' : 'rgba(0,212,255,'
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-left cursor-pointer"
      style={{
        background:  accent ? 'rgba(252,238,9,0.04)' : 'rgba(255,255,255,0.03)',
        border:      `1px solid ${accentColor}0.12)`,
      }}
      whileHover={{
        background:  accent ? 'rgba(252,238,9,0.09)' : 'rgba(0,212,255,0.06)',
        borderColor: accent ? 'rgba(252,238,9,0.35)'  : 'rgba(0,212,255,0.2)',
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12 }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: `${accentColor}0.1)`,
          border:     `1px solid ${accentColor}0.2)`,
          color:      accent ? '#FCEE09' : '#00d4ff',
        }}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[13px] font-semibold text-white/85">{label}</span>
        <span className="text-[11px] text-white/35 leading-snug">{description}</span>
      </div>
      <ChevronIcon />
    </motion.button>
  )
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="ml-auto shrink-0 text-white/20">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
