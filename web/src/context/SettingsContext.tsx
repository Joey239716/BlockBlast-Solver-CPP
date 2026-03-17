import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { PIECE_COLORS } from '@/types/solver'

// ─── Theme definitions ────────────────────────────────────────────────────────

export type ThemeId = 'dark' | 'light' | 'midnight' | 'forest'

export interface Theme {
  id:                ThemeId
  name:              string
  bg:                string
  navBg:             string
  navBorder:         string
  boardBg:           string
  cellEmpty:         string
  cellEmptyBorder:   string
  cellEmptyShadow:   string
  text:              string
  textMuted:         string
  accent:            string
  accent2:           string
  isDark:            boolean
  boardActiveBorder: string
  boardActiveGlow:   string
  cardBg:            string
  cardBorder:        string
  surfaceBg:         string
  boardBorder:       string
  boardShadow:       string
  boardFilledDefault: string
}

export const THEMES: Theme[] = [
  {
    id: 'dark', name: 'Dark',
    bg: '#060608', navBg: 'rgba(6,6,8,0.92)', navBorder: 'rgba(252,238,9,0.15)',
    boardBg: '#111118', cellEmpty: '#0c0c14', cellEmptyBorder: 'rgba(255,255,255,0.04)',
    cellEmptyShadow: 'inset 0 2px 5px rgba(0,0,0,0.7)',
    text: '#ffffff', textMuted: 'rgba(255,255,255,0.45)',
    accent: '#FCEE09', accent2: '#00F5FF', isDark: true,
    boardActiveBorder: 'rgba(245,192,48,0.35)', boardActiveGlow: 'rgba(245,192,48,0.15)',
    cardBg: 'rgba(255,255,255,0.04)', cardBorder: 'rgba(255,255,255,0.08)',
    surfaceBg: '#0e0e1a',
    boardBorder: 'rgba(0,0,0,0.6)', boardShadow: '0 8px 32px rgba(0,0,0,0.6)',
    boardFilledDefault: '#f5c030',
  },
  {
    id: 'light', name: 'Iris',
    bg: '#F4F4FB', navBg: 'rgba(244,244,251,0.96)', navBorder: 'rgba(91,91,213,0.18)',
    boardBg: '#DCDCF5', cellEmpty: '#C6C6EC', cellEmptyBorder: 'rgba(91,91,213,0.22)',
    cellEmptyShadow: 'inset 0 1px 3px rgba(0,0,0,0.07)',
    text: '#18181F', textMuted: 'rgba(24,24,31,0.48)',
    accent: '#5B5BD5', accent2: '#0891B2', isDark: false,
    boardActiveBorder: 'rgba(91,91,213,0.5)', boardActiveGlow: 'rgba(91,91,213,0.14)',
    cardBg: 'rgba(255,255,255,0.85)', cardBorder: 'rgba(91,91,213,0.14)',
    surfaceBg: 'rgba(91,91,213,0.07)',
    boardBorder: 'rgba(91,91,213,0.18)', boardShadow: '0 8px 24px rgba(91,91,213,0.1)',
    boardFilledDefault: '#5B5BD5',
  },
  {
    id: 'midnight', name: 'Midnight',
    bg: '#070b1a', navBg: 'rgba(7,11,26,0.95)', navBorder: 'rgba(99,153,255,0.2)',
    boardBg: '#0d1a35', cellEmpty: '#081025', cellEmptyBorder: 'rgba(0,0,20,0.6)',
    cellEmptyShadow: 'inset 0 2px 6px rgba(0,0,30,0.8)',
    text: '#e0e8ff', textMuted: 'rgba(200,210,255,0.45)',
    accent: '#6399ff', accent2: '#00F5FF', isDark: true,
    boardActiveBorder: 'rgba(99,153,255,0.35)', boardActiveGlow: 'rgba(99,153,255,0.12)',
    cardBg: 'rgba(99,153,255,0.04)', cardBorder: 'rgba(99,153,255,0.1)',
    surfaceBg: '#0c1228',
    boardBorder: 'rgba(0,0,0,0.6)', boardShadow: '0 8px 32px rgba(0,0,0,0.6)',
    boardFilledDefault: '#6399ff',
  },
  {
    id: 'forest', name: 'Forest',
    bg: '#0a1408', navBg: 'rgba(10,20,8,0.95)', navBorder: 'rgba(100,210,80,0.2)',
    boardBg: '#142810', cellEmpty: '#0d1e0a', cellEmptyBorder: 'rgba(0,0,0,0.5)',
    cellEmptyShadow: 'inset 0 2px 5px rgba(0,0,0,0.7)',
    text: '#d4f0c8', textMuted: 'rgba(180,230,160,0.45)',
    accent: '#7fff6a', accent2: '#00F5FF', isDark: true,
    boardActiveBorder: 'rgba(127,255,106,0.3)', boardActiveGlow: 'rgba(127,255,106,0.1)',
    cardBg: 'rgba(127,255,106,0.04)', cardBorder: 'rgba(127,255,106,0.1)',
    surfaceBg: '#0c180a',
    boardBorder: 'rgba(0,0,0,0.6)', boardShadow: '0 8px 32px rgba(0,0,0,0.6)',
    boardFilledDefault: '#7fff6a',
  },
]

// ─── Random palette ───────────────────────────────────────────────────────────

const RANDOM_PALETTE = [
  '#FF6B6B', '#FF922B', '#FCC419', '#51CF66', '#20C997',
  '#339AF0', '#4C6EF5', '#845EF7', '#F06595', '#74C0FC',
  '#63E6BE', '#DA77F2', '#FF8787', '#FFEC99', '#B2F2BB',
]

function randomColorSet(): [string, string, string] {
  const s = [...RANDOM_PALETTE].sort(() => Math.random() - 0.5)
  return [s[0], s[1], s[2]]
}

// ─── Settings type ────────────────────────────────────────────────────────────

export interface AppSettings {
  themeId:            ThemeId
  boardFilledColors:  Partial<Record<ThemeId, string>>
  pieceColors:        [string, string, string]
  randomPieceColors:  boolean
}

function defaultSettings(): AppSettings {
  return {
    themeId:           'dark',
    boardFilledColors: {},
    pieceColors:       ['#00d4ff', '#9b5cff', '#ff6b6b'],
    randomPieceColors: false,
  }
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem('bb-settings')
    if (raw) return { ...defaultSettings(), ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return defaultSettings()
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface SettingsCtx {
  settings:             AppSettings
  theme:                Theme
  effectivePieceColors: [string, string, string]
  effectiveBoardColor:  string
  updateTheme:          (id: ThemeId) => void
  updateBoardColor:     (color: string) => void
  resetBoardColor:      () => void
  updatePieceColor:     (index: 0 | 1 | 2, color: string) => void
  toggleRandomColors:   () => void
  rerollRandomColors:   () => void
}

const Ctx = createContext<SettingsCtx | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings]       = useState<AppSettings>(loadSettings)
  const [randColors, setRandColors]   = useState<[string, string, string]>(randomColorSet)

  const theme = THEMES.find(t => t.id === settings.themeId) ?? THEMES[0]

  const effectivePieceColors: [string, string, string] =
    settings.randomPieceColors ? randColors : settings.pieceColors

  const effectiveBoardColor: string =
    settings.boardFilledColors[settings.themeId] ?? theme.boardFilledDefault

  // Persist
  useEffect(() => {
    localStorage.setItem('bb-settings', JSON.stringify(settings))
  }, [settings])

  const updateTheme        = useCallback((id: ThemeId) =>
    setSettings(s => ({ ...s, themeId: id })), [])

  const updateBoardColor   = useCallback((color: string) =>
    setSettings(s => ({ ...s, boardFilledColors: { ...s.boardFilledColors, [s.themeId]: color } })), [])

  const resetBoardColor    = useCallback(() =>
    setSettings(s => {
      const next = { ...s.boardFilledColors }
      delete next[s.themeId]
      return { ...s, boardFilledColors: next }
    }), [])

  const updatePieceColor   = useCallback((index: 0 | 1 | 2, color: string) =>
    setSettings(s => {
      const c = [...s.pieceColors] as [string, string, string]
      c[index] = color
      return { ...s, pieceColors: c }
    }), [])

  const toggleRandomColors = useCallback(() =>
    setSettings(s => ({ ...s, randomPieceColors: !s.randomPieceColors })), [])

  const rerollRandomColors = useCallback(() => setRandColors(randomColorSet()), [])

  // Map PieceColor to hex — exported helper used by Grid / PlaybackGrid
  return (
    <Ctx.Provider value={{
      settings, theme, effectivePieceColors, effectiveBoardColor,
      updateTheme, updateBoardColor, resetBoardColor, updatePieceColor,
      toggleRandomColors, rerollRandomColors,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useSettings(): SettingsCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider')
  return ctx
}

/** Map a PieceColor ('cyan'|'purple'|'coral') to its effective hex string */
export function pieceColorHex(
  color: (typeof PIECE_COLORS)[number],
  effectivePieceColors: [string, string, string],
): string {
  const idx = PIECE_COLORS.indexOf(color as any)
  return idx >= 0 ? effectivePieceColors[idx] : '#ffffff'
}
