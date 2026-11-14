/** Resend-code countdown helpers (pure: the clock is passed in so they are testable). */

/** Timestamp (ms) at which the next code may be requested. */
export function resendDeadline(nowMs: number, resendSeconds: number): number {
  return nowMs + resendSeconds * 1000;
}

/** Whole seconds left until `deadlineMs`, never negative. 0 means "can resend now". */
export function secondsUntil(deadlineMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}
