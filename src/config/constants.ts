/** Network and storage constants. No magic numbers in feature code. */
export const HTTP = {
  /** Abort a request after this long. */
  timeoutMs: 20_000,
} as const;

/**
 * Free road routing (OSRM). The public demo server needs no key and is fine for light use (one request per
 * rider every 90 seconds at most). For a large fleet, host your own OSRM and set EXPO_PUBLIC_ROUTING_URL.
 */
export const ROUTING = {
  baseUrl: (process.env.EXPO_PUBLIC_ROUTING_URL ?? 'https://router.project-osrm.org').replace(/\/+$/, ''),
  timeoutMs: 10_000,
} as const;

export const STORAGE_KEYS = {
  token: 'mealawe.rider.token',
  rider: 'mealawe.rider.profile',
  onboardingDone: 'mealawe.rider.onboardingDone',
  themePreference: 'mealawe.rider.themePreference',
  permissionsPrompted: 'mealawe.rider.permissionsPrompted',
  actionQueue: 'mealawe.rider.actionQueue',
  trackingState: 'mealawe.rider.trackingState',
  trackingBuffer: 'mealawe.rider.trackingBuffer',
  proofPending: 'mealawe.rider.proofPending',
  rideStartedShift: 'mealawe.rider.rideStartedShift',
} as const;

export const OTP = {
  length: 6,
  resendSeconds: 30,
} as const;

export const PHONE = {
  length: 10,
} as const;

/** Must match the `expo-splash-screen` plugin `backgroundColor` in app.json. */
export const SPLASH = {
  backgroundColor: '#037F56',
  /** Ceiling on the animation overlay's lifetime. */
  timeoutMs: 5000,
} as const;

export const STORE_URLS = {
  playStore: 'https://play.google.com/store/apps/details?id=com.mealawerider.app',
  // TODO: replace with the App Store listing (https://apps.apple.com/app/id<ID>) once it exists.
  appStore: 'https://play.google.com/store/apps/details?id=com.mealawerider.app',
} as const;

/** Last-resort ceiling so a hung version check can never soft-lock boot. */
export const FORCE_UPDATE_TIMEOUT_MS = 6000;
