import * as ImagePicker from 'expo-image-picker';

import type { DocumentFile } from './leadForm';

export type PickSource = 'camera' | 'library';

/** Thrown when the rider refuses the camera or photos permission. */
export class PickerPermissionError extends Error {
  constructor(source: PickSource) {
    super(
      source === 'camera'
        ? 'Allow camera access in Settings to take a photo.'
        : 'Allow photo access in Settings to choose a picture.',
    );
    this.name = 'PickerPermissionError';
  }
}

/** Slightly compressed JPEGs keep uploads small on weak mobile networks. */
const QUALITY = 0.7;

/**
 * Takes or chooses one picture. Returns null if the rider cancels. `nameHint` becomes the
 * uploaded file name (for example "aadhar-front").
 */
export async function pickDocument(source: PickSource, nameHint: string): Promise<DocumentFile | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new PickerPermissionError(source);

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: QUALITY, exif: false };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;
  return { uri: asset.uri, name: `${nameHint}.jpg`, type: asset.mimeType ?? 'image/jpeg' };
}
