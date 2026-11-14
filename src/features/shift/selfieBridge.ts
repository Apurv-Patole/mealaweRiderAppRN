import { router } from 'expo-router';

import { demoPhotoFile } from '@/features/demo/demoMedia';
import { isDemoSession } from '@/features/demo/demoSession';
import type { LatLng } from '@/lib/geo';

import type { SelfieFile } from './shiftForm';

/** What the selfie screen needs to stamp on the photo. */
export interface SelfieContext {
  location: LatLng;
}

/** The finished selfie (with the stamp already on it) and the moment it was taken. */
export interface SelfieResult {
  file: SelfieFile;
  /** ISO timestamp of the shutter press, the same time printed on the photo. */
  capturedAt: string;
}

type Resolver = (result: SelfieResult | null) => void;

let pending: Resolver | null = null;
let context: SelfieContext | null = null;

/**
 * Opens the in-app selfie screen (front camera) and waits for the rider's choice. Resolves with the
 * stamped photo, or null when the rider closes the screen. The system camera app cannot be told to use
 * the front lens on every Android phone, so the app owns this camera.
 */
export function requestSelfie(selfieContext: SelfieContext): Promise<SelfieResult | null> {
  if (isDemoSession()) return Promise.resolve({ file: demoPhotoFile('selfie.png'), capturedAt: new Date().toISOString() });
  return new Promise((resolve) => {
    pending?.(null);
    pending = resolve;
    context = selfieContext;
    router.push('/selfie');
  });
}

/** The place and context for the selfie being taken, or null when the screen was opened without a request. */
export function currentSelfieContext(): SelfieContext | null {
  return context;
}

/** Called by the selfie screen with the chosen photo, or null when it closes without one. */
export function settleSelfie(result: SelfieResult | null): void {
  const resolve = pending;
  pending = null;
  context = null;
  resolve?.(result);
}
