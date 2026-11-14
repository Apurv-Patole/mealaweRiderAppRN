import { router } from 'expo-router';

import { demoPhotoFile } from '@/features/demo/demoMedia';
import { isDemoSession } from '@/features/demo/demoSession';
import type { SelfieFile } from './shiftForm';

/** What the rider entered on the odometer screen. */
export interface OdometerResult {
  km: number;
  photo: SelfieFile;
}

/** `start` is the reading at attendance; `end` is the reading when the shift ends (checked against `startKm`). */
export interface OdometerRequest {
  mode: 'start' | 'end';
  /** The reading entered at the start of the shift, for an end request. */
  startKm?: number | null;
}

type Resolver = (result: OdometerResult | null) => void;

let pending: Resolver | null = null;

const DEMO_START_KM = 12345;
const DEMO_SHIFT_KM = 12;

/** Opens the odometer screen and waits for the reading and photo. Resolves null when the rider closes it. */
export function requestOdometer(request: OdometerRequest = { mode: 'start' }): Promise<OdometerResult | null> {
  if (isDemoSession()) {
    const km = request.mode === 'end' ? (request.startKm ?? DEMO_START_KM) + DEMO_SHIFT_KM : DEMO_START_KM;
    return Promise.resolve({ km, photo: demoPhotoFile('odometer.png') });
  }
  return new Promise((resolve) => {
    pending?.(null);
    pending = resolve;
    router.push({
      pathname: '/odometer',
      params: { mode: request.mode, ...(request.startKm ? { startKm: String(request.startKm) } : {}) },
    });
  });
}

/** Called by the odometer screen with the entered reading and photo, or null when it closes without them. */
export function settleOdometer(result: OdometerResult | null): void {
  const resolve = pending;
  pending = null;
  resolve?.(result);
}
