import * as ImagePicker from 'expo-image-picker';

import { demoPhotoUri } from '@/features/demo/demoMedia';
import { isDemoSession } from '@/features/demo/demoSession';
import { PickerPermissionError } from '@/features/register/documentPicker';

/** Slightly compressed JPEGs keep uploads small on weak mobile networks. */
const PROOF_QUALITY = 0.6;

/** Opens the back camera for a pickup or delivery photo. Returns the file path, or null if the rider cancels. */
export async function captureProof(): Promise<string | null> {
  if (isDemoSession()) return demoPhotoUri();
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new PickerPermissionError('camera');

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: PROOF_QUALITY,
    exif: false,
  });
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

/**
 * If Android killed the app while the camera was open, the photo is waiting in the picker.
 * Returns its path, or null when there is nothing waiting.
 */
export async function takePendingProof(): Promise<string | null> {
  const result = await ImagePicker.getPendingResultAsync();
  if (!result || !('assets' in result) || result.canceled) return null;
  return result.assets?.[0]?.uri ?? null;
}
