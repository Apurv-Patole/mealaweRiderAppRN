import { getApp } from '@react-native-firebase/app';
import {
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';

import { ENDPOINTS, http } from '@/services/http';

import { ensureNotificationChannel } from './channels';
import { parsePushData } from './notificationData';
import { usePushEventStore } from '@/features/push/pushEventStore';
import type { PushSource } from '@/features/push/pushReactions';

/** The sender label the server uses for rider devices (see `/api/saveFcmToken`). */
const DEVICE_TYPE = 'RIDER';

function messaging() {
  return getMessaging(getApp());
}

function publishFrom(data: unknown, source: PushSource): void {
  const event = parsePushData(data);
  if (event) usePushEventStore.getState().publish(event, source);
}

/**
 * Must run at module scope (before React mounts): Android starts the app headless to
 * deliver a data message while it is in the background, and the handler has to exist
 * by then. Stage 7 shows a notification here; for now delivery is just acknowledged.
 */
export function registerBackgroundHandler(): void {
  setBackgroundMessageHandler(messaging(), async () => undefined);
}

/** Tells the server which device token belongs to this rider. */
async function saveToken(riderId: string, fcmToken: string): Promise<void> {
  await http.post(ENDPOINTS.push.saveToken, { profileId: riderId, fcmToken, type: DEVICE_TYPE });
}

/**
 * Registers this device for the rider and starts listening for push events. Returns a
 * function that stops everything (call it on sign-out). Failures are swallowed on
 * purpose: push is an enhancement, and the apps keep working on polling without it.
 */
export function startPush(riderId: string): () => void {
  const unsubscribers: (() => void)[] = [];
  let stopped = false;

  // The server names this channel on every rider push; it must exist before a notification arrives
  // while the app is closed, or Android drops the push into a quiet default channel.
  void ensureNotificationChannel().catch(() => undefined);

  void (async () => {
    try {
      const token = await getToken(messaging());
      if (!stopped && token) await saveToken(riderId, token);
    } catch {
      // no Google Play services, offline, or the server rejected it: retry on next start
    }
  })();

  unsubscribers.push(onMessage(messaging(), async (message) => publishFrom(message.data, 'foreground')));
  unsubscribers.push(onNotificationOpenedApp(messaging(), (message) => publishFrom(message.data, 'opened')));
  unsubscribers.push(
    onTokenRefresh(messaging(), (token) => {
      void saveToken(riderId, token).catch(() => undefined);
    }),
  );

  // The app was opened by tapping a notification while it was closed.
  void getInitialNotification(messaging())
    .then((message) => {
      if (!stopped && message) publishFrom(message.data, 'opened');
    })
    .catch(() => undefined);

  return () => {
    stopped = true;
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}
