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
    <nav
      className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 md:px-6 backdrop-blur-md"
      style={{ borderBottom: '1px solid rgba(252,238,9,0.15)', background: 'rgba(6,6,8,0.92)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 select-none shrink-0">
        <BlockIcon />
        <span className="font-bold text-[14px] md:text-[15px] tracking-tight leading-none">
          <span className="text-white">Block</span>
          <span style={{ color: '#FCEE09' }}>Blaster</span>
          {/* Hidden on mobile to save space */}
          <span
            className="hidden sm:inline font-mono font-normal text-[11px] ml-1.5"
            style={{ color: 'rgba(252,238,9,0.35)' }}
          >
            //AI
          </span>
        </span>
      </div>

      {/* Tab switcher */}
      <div
        className="relative flex items-center p-1 rounded-sm"
        style={{ border: '1px solid rgba(252,238,9,0.18)', background: 'rgba(252,238,9,0.04)' }}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative z-10 px-3 md:px-4 py-1.5 text-[11px] md:text-[12px] font-bold tracking-[0.12em] transition-colors duration-150 cursor-pointer uppercase"
              style={{ color: isActive ? '#060608' : 'rgba(252,238,9,0.45)' }}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-sm"
                  style={{ background: '#FCEE09', zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Balancing spacer — desktop only so it doesn't cramp mobile */}
      <div className="hidden md:block" style={{ width: 120 }} />
    </nav>
  )
}

function BlockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <rect x="1"  y="1"  width="10" height="10" rx="2.5" fill="#FCEE09" />
      <rect x="15" y="1"  width="10" height="10" rx="2.5" fill="#FCEE09" opacity="0.6" />
      <rect x="1"  y="15" width="10" height="10" rx="2.5" fill="#00F5FF" opacity="0.5" />
      <rect x="15" y="15" width="10" height="10" rx="2.5" fill="#00F5FF" opacity="0.3" />
    </svg>
  )
}
