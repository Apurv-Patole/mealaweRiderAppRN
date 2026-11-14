/**
 * Retry delay with exponential backoff and random jitter (pure; `random` is injectable for tests).
 * Attempt 0 waits about `baseMs`, then doubles up to `maxMs`. Jitter keeps many phones from
 * retrying in the same instant after a server restart.
 */
export function retryDelayMs(attempt: number, baseMs = 2_000, maxMs = 60_000, random: () => number = Math.random): number {
  const exponential = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt));
  const jitter = 0.5 + random() * 0.5;
  return Math.round(exponential * jitter);
}
