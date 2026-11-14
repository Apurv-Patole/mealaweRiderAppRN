/**
 * Status colors: one token per meaning (plan section 8.3).
 *
 * Each status has three forms:
 *  - `fill`: dots, bars, icons, and text on dark surfaces
 *  - `ink`: text and badge text on LIGHT surfaces (passes 4.5:1 against white)
 *  - `soft`: badge or row background
 *
 * Never use a raw hex in a screen; pick a `StatusTone` and read it with
 * `getStatusColors`.
 */
export type StatusTone =
  | 'assigned'
  | 'ready'
  | 'onTheWay'
  | 'done'
  | 'cancelled'
  | 'offline'
  | 'money';

export interface StatusColors {
  fill: string;
  ink: string;
  soft: string;
}

export type StatusScheme = 'light' | 'dark';

const LIGHT: Record<StatusTone, StatusColors> = {
  assigned: { fill: '#3b82f6', ink: '#1d4ed8', soft: '#dbeafe' },
  ready: { fill: '#f59e0b', ink: '#b45309', soft: '#fef3c7' },
  onTheWay: { fill: '#60c8bc', ink: '#0f5f56', soft: '#d9f4f0' },
  done: { fill: '#63ab45', ink: '#39721e', soft: '#dcfce7' },
  cancelled: { fill: '#ef4444', ink: '#b91c1c', soft: '#fee2e2' },
  offline: { fill: '#94a3b8', ink: '#6d6d6d', soft: '#f5f6f9' },
  money: { fill: '#ffb300', ink: '#8a5a00', soft: '#fff3d1' },
};

// On dark surfaces `ink` equals `fill` except where the fill fails 4.5:1 on the dark card
// or its own tint (assigned, done, cancelled), which use a lighter shade. `soft` is the
// fill blended at 18% over the dark card (#1a1d21). A test guards all of this.
const DARK: Record<StatusTone, StatusColors> = {
  assigned: { fill: '#3b82f6', ink: '#60a5fa', soft: '#202f47' },
  ready: { fill: '#f59e0b', ink: '#f59e0b', soft: '#41341d' },
  onTheWay: { fill: '#60c8bc', ink: '#60c8bc', soft: '#273c3d' },
  done: { fill: '#63ab45', ink: '#78bd54', soft: '#273727' },
  cancelled: { fill: '#ef4444', ink: '#f87171', soft: '#402427' },
  offline: { fill: '#94a3b8', ink: '#a3a9b3', soft: '#30353c' },
  money: { fill: '#ffb300', ink: '#ffb300', soft: '#43381b' },
};

export function getStatusColors(tone: StatusTone, scheme: StatusScheme): StatusColors {
  return (scheme === 'dark' ? DARK : LIGHT)[tone];
}

export const STATUS_TONES: readonly StatusTone[] = [
  'assigned',
  'ready',
  'onTheWay',
  'done',
  'cancelled',
  'offline',
  'money',
];
