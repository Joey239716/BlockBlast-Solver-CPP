import { motion } from 'framer-motion'
import { useSettings } from '@/context/SettingsContext'

export type Tab = 'setup' | 'solution' | 'settings'

interface NavbarProps {
  activeTab:   Tab
  onTabChange: (tab: Tab) => void
  onHome:      () => void
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'setup',    label: 'Setup'    },
  { id: 'solution', label: 'Solution' },
  { id: 'settings', label: 'Settings' },
]

export function Navbar({ activeTab, onTabChange, onHome }: NavbarProps) {
  const { theme } = useSettings()
  return (
    <nav
      className="sticky top-0 z-50 h-14 flex items-center px-4 md:px-6 backdrop-blur-md"
      style={{ borderBottom: `1px solid ${theme.navBorder}`, background: theme.navBg }}
    >
      {/* Logo — left */}
      <div className="flex items-center gap-2 select-none shrink-0 cursor-pointer" onClick={onHome}>
        <BlockIcon />
        <span className="font-bold text-[14px] md:text-[15px] tracking-tight leading-none">
          <span style={{ color: theme.text }}>Block</span>
          <span style={{ color: theme.accent }}>Blaster</span>
          <span
            className="hidden sm:inline font-mono font-normal text-[11px] ml-1.5"
            style={{ color: `${theme.accent}55` }}
          >
            AI
          </span>
        </span>
      </div>

      {/* Tab switcher — centered absolutely */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <div
          className="relative flex items-center p-1 rounded-sm"
          style={{ border: `1px solid ${theme.accent}2e`, background: `${theme.accent}0a` }}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative z-10 px-3 md:px-4 py-1.5 text-[11px] md:text-[12px] font-bold tracking-[0.12em] transition-colors duration-150 cursor-pointer uppercase whitespace-nowrap"
                style={{ color: isActive ? theme.bg : `${theme.accent}72` }}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-sm"
                    style={{ background: theme.accent, zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Spacer — keeps logo left-aligned */}
      <div className="ml-auto" />
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
