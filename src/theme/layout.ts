/** Layout tokens from the rider app: 16 px gutter, 12 px cards. */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export const RADIUS = {
  card: 12,
  button: 14,
  chip: 999,
} as const;

/** Touch-target sizes for one-handed, on-the-move use. */
export const TOUCH = {
  min: 48,
  primaryButton: 56,
} as const;
