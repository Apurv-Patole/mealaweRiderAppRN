import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { isDemoSession } from '@/features/demo/demoSession';
import { simulatedPosition } from '@/features/demo/demoSimulator';
import type { RiderProfile } from '@/features/auth';
import { toLatLng, type LatLng } from '@/lib/geo';

import { startShift } from './shiftApi';
import type { RiderShift } from './shiftModel';
import { useShiftStore } from './shiftStore';
import { requestOdometer } from './odometerBridge';
import { requestSelfie } from './selfieBridge';

const LOCATION_TIMEOUT_MS = 10_000;

/** A fresh GPS fix, or an error the rider can act on. Never falls back to (0, 0) like the old app did. */
async function readFreshLocation(): Promise<LatLng> {
  if (isDemoSession()) return simulatedPosition();
  const fix = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), LOCATION_TIMEOUT_MS)),
  ]).catch(() => null);

  const point = fix ? toLatLng({ lat: fix.coords.latitude, lng: fix.coords.longitude }) : null;
  if (!point) throw new Error('Could not get your location. Turn on GPS, move to open sky, and try again.');
  return point;
}

function deviceInfo(): string {
  return `${Platform.OS} ${String(Platform.Version)}`;
}

function riderRouteNo(rider: RiderProfile): string {
  return rider.routeNo ?? '';
}

/**
 * Marks attendance: GPS fix, odometer reading and photo, front-camera selfie (the in-app camera screen), upload. Returns the
 * started shift, or null if the rider closed the camera.
 */
export async function markAttendance(rider: RiderProfile, mealSlot: string): Promise<RiderShift | null> {
  const location = await readFreshLocation();
  // Step 1: the odometer reading and its photo. Step 2: the selfie, stamped with time and place.
  const odometer = await requestOdometer();
  if (!odometer) return null;
  const selfie = await requestSelfie({ location });
  if (!selfie) return null;

  const shift = await startShift({
    riderId: rider.riderId,
    routeNo: riderRouteNo(rider),
    mealSlot,
    selfie: selfie.file,
    startKm: odometer.km,
    odometerPhoto: odometer.photo,
    location,
    // The moment the selfie was taken, the same time that is printed on the photo.
    startedAt: selfie.capturedAt,
    deviceInfo: deviceInfo(),
  });
  useShiftStore.getState().setStarted(shift);
  return shift;
}
