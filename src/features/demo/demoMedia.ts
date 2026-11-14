import { Image } from 'react-native';

/** Cameras are skipped in demo mode: every "photo" is this bundled picture. */
const PLACEHOLDER = require('../../../assets/images/icon.png') as number;

export interface DemoPhotoFile {
  uri: string;
  name: string;
  type: string;
}

export function demoPhotoUri(): string {
  return Image.resolveAssetSource(PLACEHOLDER).uri;
}

export function demoPhotoFile(name: string): DemoPhotoFile {
  return { uri: demoPhotoUri(), name, type: 'image/png' };
}
