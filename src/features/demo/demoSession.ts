/**
 * Demo mode flag (pure, no imports). A demo session is a normal signed-in session whose token is
 * `DEMO_TOKEN`: the HTTP client answers it from an in-app mock server, the GPS comes from a simulated
 * rider, and the cameras are skipped. Nothing in demo mode ever reaches the real server.
 */
export const DEMO_TOKEN = 'mealawe-rider-demo-session';
export const DEMO_PHONE = '9999900000';
export const DEMO_RIDER_ID = 'demo-rider-1';

let active = false;

export function isDemoToken(token: string | null | undefined): boolean {
  return token === DEMO_TOKEN;
}

/** Keeps the synchronous flag in step with the session token (called by the auth store). */
export function syncDemoSession(token: string | null | undefined): void {
  active = isDemoToken(token);
}

/** True while the signed-in session is the demo one. */
export function isDemoSession(): boolean {
  return active;
}
