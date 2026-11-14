import { useEffect } from 'react';

import { STORAGE_KEYS } from '@/config/constants';
import { normalizeRiderProfile } from '@/features/auth/riderProfile';
import { useOrdersStore } from '@/features/orders/ordersStore';
import { useShiftStore } from '@/features/shift/shiftStore';
import { useActionQueueStore } from '@/features/trip/actionQueueStore';
import { useRideStore } from '@/features/trip/rideStore';
import { useWalletStore } from '@/features/wallet/walletStore';
import { kvStorage } from '@/services/storage';
import { useAuthStore } from '@/store';
import { useTabBadgeStore } from '@/store/tabBadgeStore';

import { demoRiderDoc } from './demoData';
import { DEMO_PHONE, DEMO_TOKEN, isDemoToken } from './demoSession';
import { startSimulator, stopSimulator } from './demoSimulator';
import { resetWorld } from './demoState';

/** Forgets everything the app learned from the demo server, so a real login never sees demo data. */
function clearClientState(): void {
  useShiftStore.getState().reset();
  useOrdersStore.getState().reset();
  useWalletStore.getState().reset();
  useActionQueueStore.setState({ items: [] });
  kvStorage.remove(STORAGE_KEYS.actionQueue);
  kvStorage.remove(STORAGE_KEYS.rideStartedShift);
  useRideStore.setState({ startedShiftId: null });
  useTabBadgeStore.getState().setOrdersCount(0);
}

/** Signs in as the demo rider on a fresh demo world. */
export async function enterDemo(): Promise<void> {
  resetWorld();
  clearClientState();
  const rider = normalizeRiderProfile(demoRiderDoc(), DEMO_PHONE);
  await useAuthStore.getState().setSession(DEMO_TOKEN, rider);
}

/** Starts the demo over: new orders, no shift, rider parked at the start. */
export async function resetDemo(): Promise<void> {
  stopSimulator();
  resetWorld();
  clearClientState();
  startSimulator();
  const rider = useAuthStore.getState().rider;
  if (!rider) return;
  await Promise.all([useShiftStore.getState().refresh(rider), useOrdersStore.getState().refresh(rider)]);
}

/** Runs the GPS simulator while a demo session is signed in, and cleans up when it ends (mounted in the root layout). */
export function useDemoLifecycle(): void {
  const token = useAuthStore((state) => state.token);
  const demo = isDemoToken(token);

  useEffect(() => {
    if (!demo) return;
    startSimulator();
    return () => {
      stopSimulator();
      resetWorld();
      clearClientState();
    };
  }, [demo]);
}
