import { STORAGE_KEYS } from '@/config/constants';
import { kvStorage } from '@/services/storage';

import { parseBuffer, parseState, type PingPayload, type TrackingState } from './trackingCore';

/**
 * Tracking state and the unsent-ping buffer live in fast local storage, not in memory: the background
 * task can run in a fresh JavaScript context after Android restarts the app, and must pick up where it left off.
 */
export function loadState(): TrackingState | null {
  return parseState(kvStorage.getObject<unknown>(STORAGE_KEYS.trackingState));
}

export function saveState(state: TrackingState): void {
  kvStorage.setObject(STORAGE_KEYS.trackingState, state);
}

export function clearState(): void {
  kvStorage.remove(STORAGE_KEYS.trackingState);
}

export function loadBuffer(): PingPayload[] {
  return parseBuffer(kvStorage.getObject<unknown>(STORAGE_KEYS.trackingBuffer));
}

export function saveBuffer(buffer: readonly PingPayload[]): void {
  kvStorage.setObject(STORAGE_KEYS.trackingBuffer, buffer);
}

export function clearBuffer(): void {
  kvStorage.remove(STORAGE_KEYS.trackingBuffer);
}
