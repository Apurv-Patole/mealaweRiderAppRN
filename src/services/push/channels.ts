import notifee, { AndroidColor, AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import { Platform } from 'react-native';

/**
 * The server hardcodes this `android.notification.channel_id` on every push (`httpFcmMessage` in
 * MealaweServerApp). The channel must exist on the phone first, or Android shows the push in a
 * quiet fallback channel instead of with sound and a heads-up banner.
 */
export const RIDER_PUSH_CHANNEL_ID = 'mealawepushnotification';

let ensured = false;

/** Creates the rider push channel once. Android only; safe to call repeatedly. */
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android' || ensured) return;
  await notifee.createChannel({
    id: RIDER_PUSH_CHANNEL_ID,
    name: 'Orders and shifts',
    description: 'New orders, orders ready for pickup, cancellations and shift reminders',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: 'default',
    vibration: true,
    lights: true,
    lightColor: AndroidColor.GREEN,
  });
  ensured = true;
}
