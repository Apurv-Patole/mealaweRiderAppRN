/**
 * Mealawe Rider palette: single source of truth in TypeScript.
 *
 * Values come from the Figma "Dev common" designs (emerald green, green-tinted greys), with a matching
 * dark twin. They replace the old rider app palette (`riderAppAI/src/theme/_palette.scss`).
 * Mirrors the CSS variables in `src/global.css`. Use these for JS-side needs
 * that cannot read CSS (navigation theme, status bar, maps). For component
 * styling prefer NativeWind classes (`bg-primary`, `text-foreground`).
 */
export const palette = {
  brand: {
    /** Primary action on light surfaces: the emerald from the Figma designs (5.03:1 against white). */
    primary: '#037f56',
    primaryShade: '#02694a',
    /** Lighter green for pressed states on dark surfaces. */
    primaryTint: '#28ac7e',
    /** Bright brand green: text, thin lines and the primary action on dark surfaces. Never text on white (2.1:1). */
    light: '#34c895',
    deep: '#042a33',
  },
  accent: {
    mint: '#60c8bc',
    mintSoft: '#88e5db',
    gold: '#ffb300',
    goldSoft: '#ffd674',
  },
  light: {
    background: '#f5f7f3',
    card: '#ffffff',
    textStrong: '#171c19',
    textMuted: '#68716b',
    border: '#e7ece7',
    muted: '#ebefea',
  },
  dark: {
    // Near-black with a green tint, the dark twin of the light page: the brand green stays an accent.
    background: '#0e1411',
    card: '#161d19',
    textStrong: '#eef3ef',
    textMuted: '#a3aea6',
    border: '#26312b',
    muted: '#1f2823',
    primarySoft: '#1b2e25',
  },
  danger: {
    /** Danger fill and text on light surfaces (6.47:1 against white). */
    ink: '#b91c1c',
    fill: '#ef4444',
  },
} as const;

export type Palette = typeof palette;
