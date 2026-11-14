import * as Location from 'expo-location';

import { startState, withStage, type TrackingContext } from './trackingCore';
import { clearBuffer, loadState, saveBuffer, saveState } from './trackingStorage';
import { flushBuffer, LOCATION_TASK, stopAndClear } from './trackingTask';

/** GPS is read about this often; pings are sent less often (see trackingCore). */
const GPS_INTERVAL_MS = 5_000;

const NOTIFICATION = {
  notificationTitle: 'Mealawe Rider',
  notificationBody: 'Sharing your location for active deliveries',
  notificationColor: '#39721e',
} as const;

/**
 * Starts background tracking for a shift, or updates it when already running (a new stage changes the
 * ping rate without restarting GPS). A different shift starts fresh. Throws if the OS refuses to start
 * (for example "Allow all the time" was not granted).
 */
export async function startTracking(context: TrackingContext): Promise<void> {
  const existing = loadState();
  if (existing && existing.context.riderId === context.riderId && existing.context.shiftId === context.shiftId) {
    saveState(withStage(existing, context.stage));
  } else {
    saveState(startState(context));
    saveBuffer([]);
  }

  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) return;
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: GPS_INTERVAL_MS,
    distanceInterval: 0,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    activityType: Location.ActivityType.AutomotiveNavigation,
    // On Android this keeps tracking alive with the screen off; the notification is required by the OS.
    foregroundService: NOTIFICATION,
  });
}

/** Stops tracking. Pings that are still waiting get one last chance to be sent first. */
export async function stopTracking(): Promise<void> {
  const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (!running && !loadState()) return;
  if (loadState()) await flushBuffer().catch(() => undefined);
  await stopAndClear();
}

/** Forgets everything without trying to send (sign-out). */
export async function abandonTracking(): Promise<void> {
  clearBuffer();
  await stopAndClear();
}
