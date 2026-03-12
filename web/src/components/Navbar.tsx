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
    <nav className="sticky top-0 z-50 h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#080810]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 select-none">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{ background: 'linear-gradient(135deg,#00d4ff,#9b5cff)' }}
        >
          ⚡
        </div>
        <span className="text-sm font-semibold tracking-tight text-white/90">
          Block Blast Solver
        </span>
      </div>

      {/* Tab switcher */}
      <div className="relative flex items-center bg-bg-surface border border-white/[0.07] rounded-full p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative z-10 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-150 cursor-pointer
              ${activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            {tab.label}
            {/* Animated active pill */}
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
      <div className="w-[152px]" />
    </nav>
  )
}
