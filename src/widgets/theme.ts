/*
 * Theme tokens for RemCraft widgets.
 *
 * Three modes are supported:
 *  - dark : original WoW-inspired night palette
 *  - light: bright, parchment-style palette for regular screens
 *  - eink : pure black/white, high-contrast palette tuned for E-Ink readers
 *           (Boox, Viwoods, Kindle browser, ...). Avoids gradients, soft
 *           greys and coloured text so ghosting & contrast stay readable.
 */

export type ThemeMode = 'dark' | 'light' | 'eink';

export interface Theme {
  mode: ThemeMode;

  /* Surfaces */
  panelBg: string;        // outer panel background (can be gradient on dark)
  surface: string;        // cards / sections
  surfaceAlt: string;     // alt cards (shop, stats, help...)
  surfaceQuest: string;   // daily quest background
  surfaceQuestWeekly: string; // weekly quest background
  surfaceShop: string;
  surfaceStats: string;
  surfaceHelp: string;
  overlayBg: string;      // battle overlay outer
  overlayInner: string;   // battle overlay inner card

  /* Borders */
  border: string;
  borderStrong: string;
  borderShop: string;
  borderQuest: string;
  borderQuestWeekly: string;
  borderStats: string;
  borderHelp: string;
  divider: string;

  /* Text */
  text: string;           // primary text
  textMuted: string;      // secondary text
  textSubtle: string;     // tertiary text / hints
  textAccent: string;     // headings ("World of Remcraft")
  textGold: string;       // gold currency text
  textStreak: string;     // streak fire color
  textQuestActive: string;
  textQuestDone: string;
  textQuestWeekly: string;
  textShop: string;
  textStats: string;
  textHelp: string;
  textHelpBody: string;
  textEnemyNormal: string;
  textEnemyElite: string;
  textShadow: string;     // text-shadow value (or 'none')

  /* Bars */
  xpTrack: string;
  xpFill: string;
  hpTrack: string;
  hpFillGood: string;     // > 60 %
  hpFillMid: string;      // 30-60 %
  hpFillLow: string;      // < 30 %
  mobHpTrack: string;
  mobHpFillNormal: string;
  mobHpFillElite: string;
  questBarTrack: string;
  questBarFillActive: string;
  questBarFillDone: string;
  questBarFillWeeklyActive: string;

  /* Buttons */
  tabActiveBg: string;
  tabActiveBorder: string;
  tabActiveText: string;
  tabIdleBg: string;
  tabIdleBorder: string;
  tabIdleText: string;
  buyBg: string;
  buyText: string;
  buyDisabledBg: string;
  buyDisabledText: string;
  resetIdleBg: string;
  resetIdleText: string;
  resetConfirmBg: string;
  resetConfirmText: string;

  /* Effects */
  panelShadow: string;        // overall panel shadow / inset
  overlayShadow: string;
  cardShadow: string;
  insetShadow: string;

  /* Misc */
  borderTopAccent: string; // 2px top border on character panel
  imageBorder: string;     // border around sprites
}

/* ------------------------- DARK (original) ------------------------- */
const dark: Theme = {
  mode: 'dark',

  panelBg: 'radial-gradient(circle at top, #2b2b3a 0, #050509 60%)',
  surface: '#1b1b27',
  surfaceAlt: '#111',
  surfaceQuest: 'linear-gradient(180deg, #20150a 0%, #120c06 100%)',
  surfaceQuestWeekly: 'linear-gradient(180deg, #1d1308 0%, #100905 100%)',
  surfaceShop: '#0d1a0d',
  surfaceStats: '#111',
  surfaceHelp: '#0c0c1a',
  overlayBg: '#2e2e34',
  overlayInner: 'rgba(12,12,18,0.96)',

  border: '#705030',
  borderStrong: '#8b5a2b',
  borderShop: '#2d5a1b',
  borderQuest: '#7c5a26',
  borderQuestWeekly: '#6b4920',
  borderStats: '#333',
  borderHelp: '#3a2b18',
  divider: 'rgba(255,255,255,0.06)',

  text: '#f5f5f5',
  textMuted: '#b0b0c0',
  textSubtle: '#888',
  textAccent: '#c79c6e',
  textGold: '#fbbf24',
  textStreak: '#fb923c',
  textQuestActive: '#f3e2b8',
  textQuestDone: '#86efac',
  textQuestWeekly: '#fdba74',
  textShop: '#86efac',
  textStats: '#cbd5e1',
  textHelp: '#c79c6e',
  textHelpBody: '#b0a090',
  textEnemyNormal: '#ffd27f',
  textEnemyElite: '#ff5555',
  textShadow: '0 0 4px #000',

  xpTrack: '#1a1a24',
  xpFill: 'linear-gradient(90deg, #503b9a, #8c63ff)',
  hpTrack: '#3a0000',
  hpFillGood: '#4ade80',
  hpFillMid: '#facc15',
  hpFillLow: '#ef4444',
  mobHpTrack: '#3a0000',
  mobHpFillNormal: 'linear-gradient(90deg, #b91c1c, #f97373)',
  mobHpFillElite: 'linear-gradient(90deg, #7f1d1d, #ef4444)',
  questBarTrack: '#2b1d10',
  questBarFillActive: 'linear-gradient(90deg,#d97706,#facc15)',
  questBarFillDone: 'linear-gradient(90deg,#15803d,#4ade80)',
  questBarFillWeeklyActive: 'linear-gradient(90deg,#b45309,#fb923c)',

  tabActiveBg: '#2a1d10',
  tabActiveBorder: '#8b5a2b',
  tabActiveText: '#ffd27f',
  tabIdleBg: '#120d08',
  tabIdleBorder: '#3a2b18',
  tabIdleText: '#8f7c5f',
  buyBg: '#15803d',
  buyText: '#fff',
  buyDisabledBg: '#333',
  buyDisabledText: '#666',
  resetIdleBg: '#1a0000',
  resetIdleText: '#666',
  resetConfirmBg: '#7f1d1d',
  resetConfirmText: '#fca5a5',

  panelShadow: 'none',
  overlayShadow: '0 0 18px rgba(0,0,0,0.72)',
  cardShadow: '0 0 8px rgba(0,0,0,0.6)',
  insetShadow: 'inset 0 0 4px #000',

  borderTopAccent: '2px solid #8b5a2b',
  imageBorder: '1px solid #705030',
};

/* ------------------------- LIGHT (parchment) ------------------------- */
const light: Theme = {
  mode: 'light',

  panelBg: 'linear-gradient(180deg, #fdf6e3 0%, #f1e5c5 100%)',
  surface: '#fffaf0',
  surfaceAlt: '#fdf6e3',
  surfaceQuest: 'linear-gradient(180deg, #fff4d6 0%, #fbe8b3 100%)',
  surfaceQuestWeekly: 'linear-gradient(180deg, #fdecc8 0%, #f7d98c 100%)',
  surfaceShop: '#e9f7e5',
  surfaceStats: '#f3f4f6',
  surfaceHelp: '#fdf6e3',
  overlayBg: '#f1e5c5',
  overlayInner: '#fffaf0',

  border: '#a67a3a',
  borderStrong: '#8b5a2b',
  borderShop: '#4d8c2b',
  borderQuest: '#b8862e',
  borderQuestWeekly: '#a06e1f',
  borderStats: '#cbd5e1',
  borderHelp: '#b8862e',
  divider: 'rgba(0,0,0,0.08)',

  text: '#2a1d10',
  textMuted: '#5a4630',
  textSubtle: '#8b7355',
  textAccent: '#8b5a2b',
  textGold: '#b45309',
  textStreak: '#c2410c',
  textQuestActive: '#7a4d10',
  textQuestDone: '#166534',
  textQuestWeekly: '#9a3412',
  textShop: '#166534',
  textStats: '#334155',
  textHelp: '#8b5a2b',
  textHelpBody: '#5a4630',
  textEnemyNormal: '#9a3412',
  textEnemyElite: '#b91c1c',
  textShadow: 'none',

  xpTrack: '#e4d4a8',
  xpFill: 'linear-gradient(90deg, #6d4ec7, #8c63ff)',
  hpTrack: '#f4cccc',
  hpFillGood: '#16a34a',
  hpFillMid: '#ca8a04',
  hpFillLow: '#dc2626',
  mobHpTrack: '#f4cccc',
  mobHpFillNormal: 'linear-gradient(90deg, #b91c1c, #ef4444)',
  mobHpFillElite: 'linear-gradient(90deg, #7f1d1d, #dc2626)',
  questBarTrack: '#e8d6a4',
  questBarFillActive: 'linear-gradient(90deg,#b45309,#f59e0b)',
  questBarFillDone: 'linear-gradient(90deg,#166534,#22c55e)',
  questBarFillWeeklyActive: 'linear-gradient(90deg,#9a3412,#ea580c)',

  tabActiveBg: '#fde9b3',
  tabActiveBorder: '#8b5a2b',
  tabActiveText: '#5a3a0f',
  tabIdleBg: '#f5e8c8',
  tabIdleBorder: '#c8a96a',
  tabIdleText: '#8b7355',
  buyBg: '#15803d',
  buyText: '#ffffff',
  buyDisabledBg: '#d1d5db',
  buyDisabledText: '#6b7280',
  resetIdleBg: '#f5e8c8',
  resetIdleText: '#8b7355',
  resetConfirmBg: '#fecaca',
  resetConfirmText: '#7f1d1d',

  panelShadow: 'none',
  overlayShadow: '0 2px 10px rgba(120, 90, 30, 0.25)',
  cardShadow: '0 1px 4px rgba(120, 90, 30, 0.18)',
  insetShadow: 'inset 0 0 2px rgba(0,0,0,0.15)',

  borderTopAccent: '2px solid #8b5a2b',
  imageBorder: '1px solid #a67a3a',
};

/* ------------------------- E-INK (pure B/W) ------------------------- *
 * Design goals:
 *   - Pure #ffffff background, pure #000000 text → maximum contrast.
 *   - No gradients (E-Ink panels approximate them poorly and ghost).
 *   - All progress bars use solid black fills on white tracks.
 *   - Borders are slightly thicker / always pure black.
 *   - Text shadows disabled (would smear).
 *   - "Color" cues replaced by emoji + bold weight + position.
 */
const eink: Theme = {
  mode: 'eink',

  panelBg: '#ffffff',
  surface: '#ffffff',
  surfaceAlt: '#ffffff',
  surfaceQuest: '#ffffff',
  surfaceQuestWeekly: '#ffffff',
  surfaceShop: '#ffffff',
  surfaceStats: '#ffffff',
  surfaceHelp: '#ffffff',
  overlayBg: '#ffffff',
  overlayInner: '#ffffff',

  border: '#000000',
  borderStrong: '#000000',
  borderShop: '#000000',
  borderQuest: '#000000',
  borderQuestWeekly: '#000000',
  borderStats: '#000000',
  borderHelp: '#000000',
  divider: '#000000',

  text: '#000000',
  textMuted: '#000000',
  textSubtle: '#333333',
  textAccent: '#000000',
  textGold: '#000000',
  textStreak: '#000000',
  textQuestActive: '#000000',
  textQuestDone: '#000000',
  textQuestWeekly: '#000000',
  textShop: '#000000',
  textStats: '#000000',
  textHelp: '#000000',
  textHelpBody: '#000000',
  textEnemyNormal: '#000000',
  textEnemyElite: '#000000',
  textShadow: 'none',

  xpTrack: '#ffffff',
  xpFill: '#000000',
  hpTrack: '#ffffff',
  hpFillGood: '#000000',
  hpFillMid: '#000000',
  hpFillLow: '#000000',
  mobHpTrack: '#ffffff',
  mobHpFillNormal: '#000000',
  mobHpFillElite: '#000000',
  questBarTrack: '#ffffff',
  questBarFillActive: '#000000',
  questBarFillDone: '#000000',
  questBarFillWeeklyActive: '#000000',

  tabActiveBg: '#000000',
  tabActiveBorder: '#000000',
  tabActiveText: '#ffffff',
  tabIdleBg: '#ffffff',
  tabIdleBorder: '#000000',
  tabIdleText: '#000000',
  buyBg: '#000000',
  buyText: '#ffffff',
  buyDisabledBg: '#ffffff',
  buyDisabledText: '#888888',
  resetIdleBg: '#ffffff',
  resetIdleText: '#000000',
  resetConfirmBg: '#000000',
  resetConfirmText: '#ffffff',

  panelShadow: 'none',
  overlayShadow: 'none',
  cardShadow: 'none',
  insetShadow: 'none',

  borderTopAccent: '2px solid #000000',
  imageBorder: '2px solid #000000',
};

export const THEMES: Record<ThemeMode, Theme> = { dark, light, eink };

export const DEFAULT_THEME_MODE: ThemeMode = 'dark';

export function getTheme(mode: ThemeMode | undefined | null): Theme {
  if (!mode || !(mode in THEMES)) return THEMES[DEFAULT_THEME_MODE];
  return THEMES[mode];
}

/* HP color helper (theme-aware) */
export function getHpFill(theme: Theme, hpPct: number): string {
  if (hpPct > 60) return theme.hpFillGood;
  if (hpPct > 30) return theme.hpFillMid;
  return theme.hpFillLow;
}

/* Storage key used by both widgets and the plugin setting. */
export const THEME_STORAGE_KEY = 'themeMode';
export const THEME_SETTING_ID = 'theme_mode';
