/** Pure display helpers for the registration screens (no React Native imports, so they are unit tested). */

/** Groups a 10-digit mobile number for display: "9876543210" becomes "98765 43210". Partial input is kept as typed. */
export function formatPhoneDisplay(digits: string): string {
  const clean = digits.replace(/\D/g, '').slice(0, 10);
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)} ${clean.slice(5)}`;
}

/** Share of the application finished once the given (zero-based) step is reached, as a whole percent. */
export function progressPercent(stepIndex: number, stepCount: number): number {
  if (stepCount <= 0) return 0;
  const clamped = Math.min(Math.max(stepIndex + 1, 0), stepCount);
  return Math.round((clamped / stepCount) * 100);
}

/** Rows for a fixed-column grid: `[1,2,3,4,5]` in 4 columns gives `[[1,2,3,4],[5]]`. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size <= 0) return [];
  const rows: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    rows.push(items.slice(start, start + size));
  }
  return rows;
}
