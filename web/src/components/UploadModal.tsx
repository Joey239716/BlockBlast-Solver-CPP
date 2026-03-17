import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  open:     boolean
  onClose:  () => void
  onFile:   (file: File) => void
}

const isMobile = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches

export function UploadModal({ open, onClose, onFile }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const filesRef  = useRef<HTMLInputElement>(null)
  const mobile    = isMobile()

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
              className="fixed z-50 left-1/2 top-1/2 w-[min(340px,90vw)]"
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

function OptionButton({ icon, label, description, onClick }: {
  icon:        React.ReactNode
  label:       string
  description: string
  onClick:     () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-left cursor-pointer"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border:     '1px solid rgba(255,255,255,0.07)',
      }}
      whileHover={{
        background:   'rgba(0,212,255,0.06)',
        borderColor:  'rgba(0,212,255,0.2)',
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12 }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: 'rgba(0,212,255,0.08)',
          border:     '1px solid rgba(0,212,255,0.15)',
          color:      '#00d4ff',
        }}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-white/85">{label}</span>
        <span className="text-[11px] text-white/35">{description}</span>
      </div>
      <ChevronIcon />
    </motion.button>
  )
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

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
