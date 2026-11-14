/** Permission rules for the rider app (pure, no React Native imports). */
export type PermissionKey = 'location' | 'backgroundLocation' | 'notifications' | 'camera' | 'battery';

/**
 * - `granted`: allowed
 * - `undetermined`: never asked, the system prompt can still be shown
 * - `denied`: refused, but the system prompt can be shown again
 * - `blocked`: refused for good, only the system Settings screen can change it
 * - `unknown`: cannot be read from the app (battery optimisation)
 */
export type PermissionStatus = 'granted' | 'undetermined' | 'denied' | 'blocked' | 'unknown';

export type PermissionStatuses = Record<PermissionKey, PermissionStatus>;

export interface PermissionItem {
  key: PermissionKey;
  title: string;
  /** Plain-language reason, shown to the rider before the system prompt. */
  why: string;
  /** Required permissions gate starting a shift; the rest are recommended. */
  required: boolean;
}

/** In the order the wizard walks through them. */
export const PERMISSION_ITEMS: readonly PermissionItem[] = [
  {
    key: 'location',
    title: 'Location while using the app',
    why: 'Confirms you are at the kitchen for attendance and pickup.',
    required: true,
  },
  {
    key: 'backgroundLocation',
    title: 'Location all the time',
    why: 'Lets customers follow their delivery while your screen is off. Choose "Allow all the time".',
    required: true,
  },
  {
    key: 'notifications',
    title: 'Notifications',
    why: 'Tells you when an order is assigned, ready for pickup, or cancelled.',
    required: true,
  },
  {
    key: 'camera',
    title: 'Camera',
    why: 'Takes your attendance selfie and the photos that prove pickup and delivery.',
    required: true,
  },
  {
    key: 'battery',
    title: 'Battery optimisation',
    why: 'Some phones stop tracking in the background. Set Mealawe Rider to "Unrestricted" so it keeps running.',
    required: false,
  },
];

export const INITIAL_STATUSES: PermissionStatuses = {
  location: 'undetermined',
  backgroundLocation: 'undetermined',
  notifications: 'undetermined',
  camera: 'undetermined',
  battery: 'unknown',
};

export type PermissionAction = 'request' | 'openSettings' | 'openBatterySettings' | 'none';

/** What the button for a permission should do given its current status. */
export function actionFor(key: PermissionKey, status: PermissionStatus): PermissionAction {
  if (key === 'battery') return 'openBatterySettings';
  if (status === 'granted') return 'none';
  if (status === 'blocked') return 'openSettings';
  return 'request';
}

/**
 * "Always" location can only be asked once foreground location is granted, so it
 * is not actionable before that.
 */
export function isActionable(key: PermissionKey, statuses: PermissionStatuses): boolean {
  if (key === 'backgroundLocation') return statuses.location === 'granted';
  return true;
}

/** Required permissions that are not granted yet, in wizard order. */
export function missingRequired(statuses: PermissionStatuses): PermissionKey[] {
  return PERMISSION_ITEMS.filter((item) => item.required && statuses[item.key] !== 'granted').map(
    (item) => item.key,
  );
}

/** True when everything needed to start a shift is granted. */
export function isReady(statuses: PermissionStatuses): boolean {
  return missingRequired(statuses).length === 0;
}

/** First required permission that still needs attention, or null when ready. */
export function nextKey(statuses: PermissionStatuses): PermissionKey | null {
  return missingRequired(statuses)[0] ?? null;
}

export function statusLabel(status: PermissionStatus): string {
  switch (status) {
    case 'granted':
      return 'Allowed';
    case 'blocked':
      return 'Blocked';
    case 'denied':
      return 'Not allowed';
    case 'undetermined':
      return 'Not set';
    case 'unknown':
      return 'Check';
  }
}
