import { File } from 'expo-file-system';

/** A picked or captured picture on the phone, as the form builders describe it. */
export interface FilePart {
  uri: string;
  name: string;
  type: string;
}

/**
 * Adds a text or file field to a `FormData`. Expo SDK 54+ uses the standard fetch, whose FormData accepts only
 * strings and real `Blob`/`File` objects; the old React Native `{ uri, name, type }` trick throws "Unsupported
 * FormDataPart implementation". `File` from expo-file-system wraps a local file as a proper `Blob`.
 */
export function appendPart(form: FormData, name: string, value: string | FilePart): void {
  form.append(name, typeof value === 'string' ? value : new File(value.uri));
}
