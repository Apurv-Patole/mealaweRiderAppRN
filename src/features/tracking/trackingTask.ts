import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { STORAGE_KEYS } from '@/config/constants';
import { isRetryableFailure } from '@/features/trip/actionQueue';
import { ENDPOINTS, http, HttpError } from '@/services/http';
import { secureStorage } from '@/services/storage';

import {
  applyReply,
  enqueuePing,
  onFix,
  parsePingReply,
  type Fix,
} from './trackingCore';
import { clearBuffer, clearState, loadBuffer, loadState, saveBuffer, saveState } from './trackingStorage';

/** The OS-level background task that receives GPS fixes, even with the screen off or the app closed. */
export const LOCATION_TASK = 'mealawe-rider-location';

/** At most this many buffered pings are sent per run, so a long backlog cannot hold the task open. */
const MAX_SENT_PER_RUN = 50;

function toFix(location: Location.LocationObject): Fix {
  const { latitude, longitude, accuracy, speed, heading } = location.coords;
  return {
    lat: latitude,
    lng: longitude,
    accuracy: accuracy ?? null,
    // The OS reports -1 when speed or heading is unknown.
    speed: speed !== null && speed >= 0 ? speed : null,
    heading: heading !== null && heading >= 0 ? heading : null,
    timestamp: location.timestamp,
  };
}

/** Stops the OS updates and forgets the tracking state and any unsent pings. */
export async function stopAndClear(): Promise<void> {
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => undefined);
  }
  clearState();
  clearBuffer();
}

let flushing = false;

/**
 * Sends the buffered pings, oldest first, stopping at the first connection problem (the rest wait for the next
 * run). A ping the server refuses for good is dropped; a "stop" reply for the CURRENT shift stops tracking, while
 * one for an older shift (a leftover ping) is just dropped.
 */
export async function flushBuffer(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const token = await secureStorage.get(STORAGE_KEYS.token);
    if (!token) {
      await stopAndClear();
      return;
    }

    for (let sent = 0; sent < MAX_SENT_PER_RUN; sent += 1) {
      const buffer = loadBuffer();
      const next = buffer[0];
      if (!next) return;

      try {
        const raw = await http.post<unknown>(ENDPOINTS.tracking.ping, next, {
          headers: { Authorization: `Bearer ${token}` },
          skipUnauthorizedHandler: true,
        });
        saveBuffer(buffer.slice(1));

        const reply = parsePingReply(raw);
        const state = loadState();
        if (reply.stop) {
          if (state && state.context.shiftId === next.shiftId) {
            await stopAndClear();
            return;
          }
          continue;
        }
        if (state) saveState(applyReply(state, reply));
      } catch (error: unknown) {
        if (error instanceof HttpError && !isRetryableFailure(error.status)) {
          if (error.status === 401) {
            // The session was revoked (the rider signed in on another phone): stop sharing.
            await stopAndClear();
            return;
          }
          saveBuffer(buffer.slice(1));
          continue;
        }
        return; // no connection or server trouble: keep everything and try next time
      }
    }
  } finally {
    flushing = false;
  }
}

/** Serialises runs so two batches of fixes never read and write the saved state at the same time. */
let chain: Promise<void> = Promise.resolve();

async function handleLocations(locations: Location.LocationObject[]): Promise<void> {
  let state = loadState();
  if (!state) {
    // Updates are still running but nothing is being tracked (for example after sign-out): shut them down.
    await stopAndClear();
    return;
  }

  let buffer = loadBuffer();
  for (const location of locations) {
    const fix = toFix(location);
    // The fix's own time decides when a ping is due, so a batch delivered late is still sampled correctly.
    const result = onFix(state, fix, fix.timestamp);
    state = result.state;
    if (result.ping) buffer = enqueuePing(buffer, result.ping);
  }
  saveState(state);
  saveBuffer(buffer);
  await flushBuffer();
}

// Must be defined at module scope (imported from the root layout) so the OS can wake the app headless.
TaskManager.defineTask(LOCATION_TASK, ({ data, error }) => {
  if (error) return Promise.resolve();
  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations ?? [];
  if (locations.length === 0) return Promise.resolve();
  chain = chain.then(() => handleLocations(locations)).catch(() => undefined);
  return chain;
});
