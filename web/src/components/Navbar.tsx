import { motion } from 'framer-motion'

type Tab = 'setup' | 'solution'

interface NavbarProps {
  activeTab:   Tab
  onTabChange: (tab: Tab) => void
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'setup',    label: 'Setup'    },
  { id: 'solution', label: 'Solution' },
]

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#080810]/90 backdrop-blur-md">
      {/* Logo */}
      <div className="flex items-center gap-2.5 select-none">
        <BlockIcon />
        <span className="font-russo text-[15px] tracking-tight text-white leading-none">
          Block<span style={{ background: 'linear-gradient(90deg,#00d4ff,#9b5cff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Blast</span>
          <span className="text-white/40 text-[11px] font-sans font-medium ml-1.5">Solver</span>
        </span>
      </div>

      {/* Tab switcher */}
      <div className="relative flex items-center bg-bg-surface border border-white/[0.07] rounded-full p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative z-10 px-4 py-1.5 rounded-full text-[12px] font-semibold tracking-wide transition-colors duration-150 cursor-pointer uppercase
              ${activeTab === tab.id ? 'text-white' : 'text-white/35 hover:text-white/60'}`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 rounded-full bg-bg-elevated border border-white/[0.1]"
                style={{ zIndex: -1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 36 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Spacer to balance logo */}
      <div className="w-[160px]" />
    </nav>
  )
}

function BlockIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="blk-lg" x1="0" y1="0" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00d4ff" />
          <stop offset="1" stopColor="#9b5cff" />
        </linearGradient>
      </defs>
      <rect x="1"  y="1"  width="10" height="10" rx="3" fill="url(#blk-lg)" />
      <rect x="15" y="1"  width="10" height="10" rx="3" fill="url(#blk-lg)" opacity="0.65" />
      <rect x="1"  y="15" width="10" height="10" rx="3" fill="url(#blk-lg)" opacity="0.45" />
      <rect x="15" y="15" width="10" height="10" rx="3" fill="url(#blk-lg)" opacity="0.28" />
    </svg>
  )
}
