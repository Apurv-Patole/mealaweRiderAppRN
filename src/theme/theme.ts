import { palette } from './palette';

/**
 * Semantic colors for light and dark. They match the CSS variables in
 * `src/global.css`, so JS-driven surfaces (navigation bar, native tabs,
 * status bar) stay in sync with NativeWind styling.
 */
export interface SemanticColors {
  background: string;
  foreground: string;
  card: string;
  muted: string;
  mutedForeground: string;
  border: string;
  /** Primary action fill: deep green on light, bright green on dark. */
  primary: string;
  /** Text on a primary fill. */
  primaryForeground: string;
  primaryPressed: string;
  /** Selected-tab pill (Android native tabs) and soft primary backgrounds. */
  primarySoft: string;
  danger: string;
  dangerForeground: string;
}

export const lightColors: SemanticColors = {
  background: palette.light.background,
  foreground: palette.light.textStrong,
  card: palette.light.card,
  muted: palette.light.muted,
  mutedForeground: palette.light.textMuted,
  border: palette.light.border,
  primary: palette.brand.primary,
  primaryForeground: '#ffffff',
  primaryPressed: palette.brand.primaryShade,
  primarySoft: '#e6f2ee',
  danger: palette.danger.ink,
  dangerForeground: '#ffffff',
};

export const darkColors: SemanticColors = {
  background: palette.dark.background,
  foreground: palette.dark.textStrong,
  card: palette.dark.card,
  muted: palette.dark.muted,
  mutedForeground: palette.dark.textMuted,
  border: palette.dark.border,
  primary: palette.brand.light,
  primaryForeground: palette.dark.background,
  primaryPressed: palette.brand.primaryTint,
  primarySoft: palette.dark.primarySoft,
  danger: palette.danger.fill,
  dangerForeground: palette.dark.background,
};

export type ColorSchemeName = 'light' | 'dark';

export function getSemanticColors(scheme: ColorSchemeName): SemanticColors {
  return scheme === 'dark' ? darkColors : lightColors;
}
