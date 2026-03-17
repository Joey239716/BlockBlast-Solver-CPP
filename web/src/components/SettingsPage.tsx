import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useSettings, THEMES, type ThemeId } from '@/context/SettingsContext'
import { PIECE_COLORS } from '@/types/solver'

export function SettingsPage() {
  const {
    settings, theme, effectivePieceColors,
    updateTheme, updateBoardColor, updatePieceColor,
    toggleRandomColors, rerollRandomColors,
  } = useSettings()

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* ── Color Scheme ─────────────────────────────── */}
      <Section label="Color Scheme">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {THEMES.map(t => (
            <ThemeCard
              key={t.id}
              t={t}
              selected={settings.themeId === t.id}
              onSelect={() => updateTheme(t.id as ThemeId)}
            />
          ))}
        </div>
      </Section>

      {/* ── Board Color ──────────────────────────────── */}
      <Section label="Board Color">
        <div className="flex flex-col gap-3">
          <p className="text-[12px]" style={{ color: theme.textMuted }}>
            Color used for filled cells on the board.
          </p>
          <div className="flex items-center gap-4">
            <ColorSwatch
              color={settings.boardFilledColor}
              onChange={updateBoardColor}
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold" style={{ color: theme.text }}>
                Filled Cell
              </span>
              <span className="text-[11px] font-mono uppercase" style={{ color: theme.textMuted }}>
                {settings.boardFilledColor}
              </span>
            </div>
            <button
              className="ml-auto text-[11px] font-semibold cursor-pointer px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: theme.textMuted, border: `1px solid ${theme.cardBorder}`, background: theme.cardBg }}
              onClick={() => updateBoardColor('#f5c030')}
            >
              Reset
            </button>
          </div>

          {/* Preview */}
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl mt-1"
            style={{ background: theme.boardBg, width: 'fit-content' }}
          >
            {[1,0,1,0,1,1,0,1].map((filled, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-[5px]"
                style={filled ? {
                  background: settings.boardFilledColor,
                  boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.35)',
                } : {
                  background: theme.cellEmpty,
                  border: `1px solid ${theme.cellEmptyBorder}`,
                }}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* ── Piece Colors ─────────────────────────────── */}
      <Section label="Piece Colors">
        <div className="flex flex-col gap-4">
          {/* Random toggle */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold" style={{ color: theme.text }}>
                Random Colors
              </span>
              <span className="text-[11px]" style={{ color: theme.textMuted }}>
                Shuffle piece colors on every session, like Block Blast
              </span>
            </div>
            <div className="flex items-center gap-2">
              {settings.randomPieceColors && (
                <motion.button
                  className="text-[11px] font-semibold cursor-pointer px-3 py-1.5 rounded-lg"
                  style={{ color: theme.accent, border: `1px solid ${theme.accent}44`, background: `${theme.accent}0f` }}
                  onClick={rerollRandomColors}
                  whileHover={{ opacity: 0.8 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Reroll
                </motion.button>
              )}
              <Toggle active={settings.randomPieceColors} onToggle={toggleRandomColors} accent={theme.accent} />
            </div>
          </div>

          {/* Per-piece pickers */}
          <div className="flex flex-col gap-2">
            {PIECE_COLORS.map((pc, i) => (
              <div
                key={pc}
                className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{
                  background: theme.cardBg,
                  border: `1px solid ${theme.cardBorder}`,
                  opacity: settings.randomPieceColors ? 0.45 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <ColorSwatch
                  color={effectivePieceColors[i]}
                  onChange={color => updatePieceColor(i as 0|1|2, color)}
                  disabled={settings.randomPieceColors}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-semibold capitalize" style={{ color: theme.text }}>
                    Piece {i + 1}
                  </span>
                  <span className="text-[11px] font-mono uppercase" style={{ color: theme.textMuted }}>
                    {effectivePieceColors[i]}
                  </span>
                </div>
                {!settings.randomPieceColors && (
                  <button
                    className="ml-auto text-[11px] font-semibold cursor-pointer px-3 py-1.5 rounded-lg"
                    style={{ color: theme.textMuted, border: `1px solid ${theme.cardBorder}`, background: theme.cardBg }}
                    onClick={() => updatePieceColor(i as 0|1|2, ['#00d4ff','#9b5cff','#ff6b6b'][i])}
                  >
                    Reset
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  )
}

// ─── Theme card ───────────────────────────────────────────────────────────────

function ThemeCard({ t, selected, onSelect }: { t: typeof THEMES[0]; selected: boolean; onSelect: () => void }) {
  return (
    <motion.button
      onClick={onSelect}
      className="relative flex flex-col items-center gap-2.5 p-3 rounded-xl cursor-pointer text-left"
      style={{
        background:   selected ? `${t.accent}18` : t.cardBg,
        border:       `1px solid ${selected ? t.accent + '55' : t.cardBorder}`,
        backdropFilter: 'blur(8px)',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12 }}
    >
      {/* Mini preview */}
      <div
        className="w-full rounded-lg overflow-hidden"
        style={{ background: t.bg, padding: '8px 8px 4px' }}
      >
        {/* Nav bar preview */}
        <div className="w-full h-2 rounded-sm mb-1.5" style={{ background: t.navBg, border: `1px solid ${t.navBorder}` }} />
        {/* Board preview */}
        <div className="w-full rounded-md p-1" style={{ background: t.boardBg }}>
          <div className="grid grid-cols-4 gap-0.5">
            {[1,0,1,1,0,1,0,1,1,1,0,0,0,1,1,0].map((v,i) => (
              <div
                key={i}
                className="aspect-square rounded-[2px]"
                style={{ background: v ? t.accent : t.cellEmpty }}
              />
            ))}
          </div>
        </div>
      </div>

      <span className="text-[12px] font-bold" style={{ color: t.text, background: t.bg, padding: '0 4px', borderRadius: 4 }}>
        {t.name}
      </span>

      {selected && (
        <motion.div
          layoutId="theme-check"
          className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: t.accent }}
        >
          <svg width="8" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke={t.isDark ? '#000' : '#fff'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      )}
    </motion.button>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const { theme } = useSettings()
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold tracking-[0.12em] uppercase" style={{ color: theme.text }}>
          {label}
        </span>
        <div className="flex-1 h-px" style={{ background: theme.cardBorder }} />
      </div>
      {children}
    </section>
  )
}

// ─── Color swatch picker ──────────────────────────────────────────────────────

function ColorSwatch({ color, onChange, disabled }: { color: string; onChange: (c: string) => void; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="relative flex-shrink-0">
      <motion.button
        className="w-10 h-10 rounded-xl cursor-pointer border-2"
        style={{
          background:    color,
          borderColor:   `${color}88`,
          boxShadow:     `0 0 12px ${color}44, inset 0 1px 0 rgba(255,255,255,0.25)`,
          cursor:        disabled ? 'not-allowed' : 'pointer',
          opacity:       disabled ? 0.5 : 1,
        }}
        onClick={() => !disabled && ref.current?.click()}
        whileHover={!disabled ? { scale: 1.08 } : {}}
        whileTap={!disabled   ? { scale: 0.95 } : {}}
        transition={{ duration: 0.1 }}
      />
      <input
        ref={ref}
        type="color"
        value={color}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  )
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ active, onToggle, accent }: { active: boolean; onToggle: () => void; accent: string }) {
  return (
    <motion.button
      onClick={onToggle}
      className="relative flex-shrink-0 cursor-pointer rounded-full"
      style={{
        width: 40, height: 22,
        background: active ? accent : 'rgba(255,255,255,0.12)',
        border: `1px solid ${active ? accent : 'rgba(255,255,255,0.1)'}`,
        transition: 'background 0.2s, border-color 0.2s',
      }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute top-0.5 rounded-full"
        style={{
          width: 16, height: 16,
          background: active ? '#000' : 'rgba(255,255,255,0.6)',
        }}
        animate={{ x: active ? 19 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  )
}
