import { getApp } from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  getMessaging,
  hasPermission as hasIosPushPermission,
  requestPermission as requestIosPushPermission,
} from '@react-native-firebase/messaging';
import * as ImagePicker from 'expo-image-picker';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Location from 'expo-location';
import { Linking, PermissionsAndroid, Platform } from 'react-native';

import { isDemoSession } from '@/features/demo/demoSession';

import {
  INITIAL_STATUSES,
  type PermissionKey,
  type PermissionStatus,
  type PermissionStatuses,
} from './permissionState';

/** Android "ignore battery optimisations" list: a Settings screen, so no special permission is needed. */
const BATTERY_SETTINGS_ACTION = 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS';

type LocationResponse = Pick<Location.LocationPermissionResponse, 'granted' | 'canAskAgain' | 'status'>;

function fromLocation(response: LocationResponse): PermissionStatus {
  if (response.granted) return 'granted';
  if (response.status === Location.PermissionStatus.UNDETERMINED) return 'undetermined';
  return response.canAskAgain ? 'denied' : 'blocked';
}

function fromCamera(response: Pick<ImagePicker.PermissionResponse, 'granted' | 'canAskAgain' | 'status'>): PermissionStatus {
  if (response.granted) return 'granted';
  if (response.status === ImagePicker.PermissionStatus.UNDETERMINED) return 'undetermined';
  return response.canAskAgain ? 'denied' : 'blocked';
}

async function notificationsStatus(): Promise<PermissionStatus> {
  if (Platform.OS === 'android') {
    // Before Android 13 notifications need no runtime permission.
    if (Platform.Version < 33) return 'granted';
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    // `check` cannot tell "never asked" from "refused", so "not granted" stays requestable
    // and a refused request reports 'blocked' from `requestPermission` below.
    return granted ? 'granted' : 'undetermined';
  }
  const status = await hasIosPushPermission(getMessaging(getApp()));
  if (status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL) return 'granted';
  return status === AuthorizationStatus.DENIED ? 'blocked' : 'undetermined';
}

/** Reads the current status of every permission without prompting. */
export async function readStatuses(): Promise<PermissionStatuses> {
  if (isDemoSession()) {
    return { location: 'granted', backgroundLocation: 'granted', notifications: 'granted', camera: 'granted', battery: 'granted' };
  }
  const [foreground, background, notifications, camera] = await Promise.all([
    Location.getForegroundPermissionsAsync(),
    Location.getBackgroundPermissionsAsync(),
    notificationsStatus(),
    ImagePicker.getCameraPermissionsAsync(),
  ]);
  return {
    ...INITIAL_STATUSES,
    location: fromLocation(foreground),
    backgroundLocation: fromLocation(background),
    notifications,
    camera: fromCamera(camera),
  };
}

/** Shows the system prompt for one permission and returns its new status. */
export async function requestPermission(key: PermissionKey): Promise<PermissionStatus> {
  if (isDemoSession()) return 'granted';
  switch (key) {
    case 'location':
      return fromLocation(await Location.requestForegroundPermissionsAsync());
    case 'backgroundLocation':
      // On Android 11+ this opens the system Settings screen to choose "Allow all the time".
      return fromLocation(await Location.requestBackgroundPermissionsAsync());
    case 'notifications': {
      if (Platform.OS === 'android') {
        if (Platform.Version < 33) return 'granted';
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
        if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          // The system will not show the prompt again, so send the rider to Settings now.
          await openAppSettings();
          return 'blocked';
        }
        return 'denied';
      }
      const status = await requestIosPushPermission(getMessaging(getApp()));
      return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL
        ? 'granted'
        : 'blocked';
    }
    case 'camera':
      return fromCamera(await ImagePicker.requestCameraPermissionsAsync());
    case 'battery':
      await openBatterySettings();
      return 'unknown';
  }
}

export async function openAppSettings(): Promise<void> {
  await Linking.openSettings();
}

/** Opens the battery-optimisation list on Android; falls back to app settings elsewhere. */
export async function openBatterySettings(): Promise<void> {
  if (Platform.OS !== 'android') {
    await openAppSettings();
    return;
  }
  try {
    await IntentLauncher.startActivityAsync(BATTERY_SETTINGS_ACTION);
  } catch {
    await openAppSettings();
  }
}
