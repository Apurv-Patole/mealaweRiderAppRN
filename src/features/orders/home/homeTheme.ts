import { ONBOARDING_COLORS } from '@/features/onboarding/onboardingTheme';
import type { ColorSet } from '@/theme/colorSet';

/**
 * Colours for the redesigned Home tab (Figma "Dev common", node 2003:1351). It shares the emerald green with
 * onboarding and login, and adds the dark active-shift card and the blue demo banner. Scoped here until the
 * app is re-themed, then promote into `src/global.css`. Each palette has a `_DARK` twin; read them with
 * `useHomeColors()`, `useDetailColors()` and `useOrderPill()`.
 */
export const HOME_COLORS = {
  canvas: ONBOARDING_COLORS.canvas,
  card: ONBOARDING_COLORS.sheet,
  green: ONBOARDING_COLORS.green,
  greenInk: ONBOARDING_COLORS.greenInk,
  onGreen: ONBOARDING_COLORS.onGreen,
  ink: ONBOARDING_COLORS.ink,
  muted: ONBOARDING_COLORS.muted,
  /** Page and card titles are a touch bluer than body ink in the design. */
  title: '#111827',
  border: '#e7ece7',
  /** Divider inside a card under its header row. */
  hairline: 'rgba(231,236,231,0.7)',
  /** Divider between KPI columns. */
  kpiDivider: 'rgba(231,236,231,0.6)',
  /** Status dot when the rider is off shift. */
  dotOff: '#a7b0a9',
  initialsBg: '#e0efe8',
  initialsBorder: '#cbe5d9',
  initialsInk: '#075c40',
  bannerBg: '#ebf3fc',
  bannerBorder: '#cce0f5',
  bannerInk: '#1a4b85',
  completedBg: '#e8f6ed',
  completedInk: '#16834a',
  /** The running shift's card. */
  activeBg: '#075c40',
  lime: '#b8f52b',
  onActiveSoft: 'rgba(255,255,255,0.8)',
  onActiveFaint: 'rgba(255,255,255,0.7)',
  onActiveDate: 'rgba(255,255,255,0.9)',
  activeGlass: 'rgba(255,255,255,0.15)',
  activeGlassBorder: 'rgba(255,255,255,0.1)',
  /** Order card timeline: dashed connector and the two stop tiles. */
  connector: '#cad3cc',
  pickupTile: '#075c40',
  dropoffTile: '#1c1f1d',
} as const;

export type HomeColors = typeof HOME_COLORS;

export const HOME_COLORS_DARK: ColorSet<HomeColors> = {
  canvas: '#0e1411',
  card: '#161d19',
  green: '#037f56',
  greenInk: '#34c895',
  onGreen: '#ffffff',
  ink: '#eef3ef',
  muted: '#a3aea6',
  title: '#f1f5f2',
  border: '#26312b',
  hairline: 'rgba(38,49,43,0.9)',
  kpiDivider: 'rgba(38,49,43,0.9)',
  dotOff: '#5c6a61',
  initialsBg: '#1d3329',
  initialsBorder: '#2a4a3b',
  initialsInk: '#7fe0b8',
  bannerBg: '#16253a',
  bannerBorder: '#2d4766',
  bannerInk: '#9ec5f5',
  completedBg: '#1c3226',
  completedInk: '#5fd39a',
  activeBg: '#0a6446',
  lime: '#b8f52b',
  onActiveSoft: 'rgba(255,255,255,0.8)',
  onActiveFaint: 'rgba(255,255,255,0.7)',
  onActiveDate: 'rgba(255,255,255,0.9)',
  activeGlass: 'rgba(255,255,255,0.15)',
  activeGlassBorder: 'rgba(255,255,255,0.1)',
  connector: '#3a463f',
  pickupTile: '#0a6446',
  dropoffTile: '#2c3832',
};

/** Status pill colours on an order card, by tone. `assigned` (Preparing, Accepted) is the design's blue. */
export const ORDER_PILL = {
  assigned: { bg: '#ebf4fe', ink: '#2b64b1' },
  ready: { bg: '#fef3c7', ink: '#b45309' },
  onTheWay: { bg: '#d9f4f0', ink: '#0f5f56' },
  done: { bg: '#e8f6ed', ink: '#14773f' },
  cancelled: { bg: '#fee2e2', ink: '#b91c1c' },
  offline: { bg: '#eef1ee', ink: '#5b645e' },
  money: { bg: '#fff3d1', ink: '#8a5a00' },
} as const;

export type OrderPillColors = typeof ORDER_PILL;

export const ORDER_PILL_DARK: { readonly [K in keyof OrderPillColors]: { readonly bg: string; readonly ink: string } } = {
  assigned: { bg: '#1b2a3d', ink: '#8ab8f0' },
  ready: { bg: '#3d3318', ink: '#f5b94a' },
  onTheWay: { bg: '#1c3a37', ink: '#6fd8cc' },
  done: { bg: '#1c3226', ink: '#5fd39a' },
  cancelled: { bg: '#432529', ink: '#f58f8f' },
  offline: { bg: '#222b26', ink: '#a3aea6' },
  money: { bg: '#3e3418', ink: '#f0c25a' },
};

export const HOME_METRICS = {
  radius: 16,
  dateTileHeight: 87,
  dateGap: 10,
  avatar: 48,
  /** Gap between page sections. */
  gap: 16,
  stopTile: 36,
} as const;

/** Extra colours for the order detail screen (Figma "Lunch Order 16", node 2003:1913). */
export const DETAIL_COLORS = {
  /** Muted copy and pending progress steps on this screen are a cool grey. */
  subtle: '#6b7280',
  pending: '#d1d5db',
  nextCard: '#075c40',
  nextEyebrow: 'rgba(209,250,229,0.9)',
  nextBody: 'rgba(236,253,245,0.9)',
  tonalButton: '#e6f4ee',
  tagInk: '#343b36',
  stopDark: '#181f1c',
  metaInk: '#68716b',
  /** Step labels and times in the progress tracker once a step has been reached. */
  stepInk: '#4b5563',
  /** The green "Pickup photo saved" banner. */
  confirmBorder: '#c3ead2',
  confirmInk: '#1f2937',
  /** Hairline around the small route map on the order screen. */
  mapBorder: '#dfeae2',
} as const;

export type DetailColors = typeof DETAIL_COLORS;

export const DETAIL_COLORS_DARK: ColorSet<DetailColors> = {
  subtle: '#a0aaa3',
  pending: '#3a443d',
  nextCard: '#0a6446',
  nextEyebrow: 'rgba(209,250,229,0.9)',
  nextBody: 'rgba(236,253,245,0.9)',
  tonalButton: '#1b2e25',
  tagInk: '#d6ded8',
  stopDark: '#2c3832',
  metaInk: '#a3aea6',
  stepInk: '#c3cdc6',
  confirmBorder: '#2a4a3b',
  confirmInk: '#eef3ef',
  mapBorder: '#26312b',
};
