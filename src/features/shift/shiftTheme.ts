import type { ColorSet } from '@/theme/colorSet';

/**
 * Colours the Route tab adds on top of the shared Home palette (Figma "Dev common", node 2003:2960): the blue
 * instruction box, the green "open" pills and the slot status pills. `SHIFT_COLORS_DARK` is the dark twin; read
 * them with `useShiftColors()`.
 */
export const SHIFT_COLORS = {
  noteBg: '#e8f1fc',
  noteBorder: '#bfdbfe',
  noteInk: '#1e3a8a',
  pillOpenBg: '#e6f4ea',
  pillInk: '#075c40',
  pillOutline: '#cfead8',
  /** Dashed line between "You" and the pickup. */
  trackLine: 'rgba(3,127,86,0.6)',
  destination: '#075c40',
  /** Secondary copy on the slots card. */
  soft: '#68736c',
  rowDivider: '#f0f2ee',
  cardBorder: '#ebece7',
  missedBg: '#fce8e8',
  missedInk: '#b91c1c',
  openBg: '#e8f1fc',
  openInk: '#1d4ed8',
  upcomingBg: '#e8ede9',
  upcomingInk: '#404d46',
  /** Online shift card: the "location sharing is off" alert and the grey End shift button. */
  alertBg: '#fff6e9',
  alertBorder: '#e9c394',
  alertInk: '#8f520b',
  endShiftBg: '#eaefea',
  endShiftInk: '#1e293b',
  /** Next-stop card: distance badges, order chips, the "You are here" pill and the scooter tile. */
  badgeBorder: '#e2e8f0',
  badgeInk: '#334155',
  chipBg: '#e8efea',
  chipInk: '#1e293b',
  label: '#64748b',
  hereBg: '#d8f5e7',
  hereInk: '#056d49',
  nextTile: '#03593d',
  /** Buttons floating on the map. */
  mapChrome: 'rgba(255,255,255,0.95)',
  /** Hairline between stops in the "Then" card. */
  listDivider: '#f1f5f9',
} as const;

export type ShiftColors = typeof SHIFT_COLORS;

export const SHIFT_COLORS_DARK: ColorSet<ShiftColors> = {
  noteBg: '#16253a',
  noteBorder: '#2d4766',
  noteInk: '#bcd4f7',
  pillOpenBg: '#1c3226',
  pillInk: '#7fe0b8',
  pillOutline: '#2a4a3b',
  trackLine: 'rgba(52,200,149,0.6)',
  destination: '#0a6446',
  soft: '#a3aea6',
  rowDivider: '#26312b',
  cardBorder: '#26312b',
  missedBg: '#432529',
  missedInk: '#f58f8f',
  openBg: '#1b2a3d',
  openInk: '#8ab8f0',
  upcomingBg: '#26302a',
  upcomingInk: '#b7c2ba',
  alertBg: '#3a2f1a',
  alertBorder: '#6b5426',
  alertInk: '#f0c27a',
  endShiftBg: '#222b26',
  endShiftInk: '#e3e9e5',
  badgeBorder: '#35423a',
  badgeInk: '#d6ded8',
  chipBg: '#222b26',
  chipInk: '#e3e9e5',
  label: '#a3aea6',
  hereBg: '#1c3226',
  hereInk: '#7fe0b8',
  nextTile: '#0a6446',
  mapChrome: 'rgba(22,29,25,0.95)',
  listDivider: '#26312b',
};
