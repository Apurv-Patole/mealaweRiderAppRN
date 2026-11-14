import { dialog } from '@/components/dialog/dialog';

import { pickDocument, PickerPermissionError, type PickSource } from './documentPicker';
import type { DocumentFile } from './leadForm';

/**
 * Takes or chooses one picture and hands it to `onChange`. A refused permission or a picker failure
 * shows a short dialog; cancelling does nothing. Never throws.
 */
export async function pickAndReport(
  source: PickSource,
  nameHint: string,
  onChange: (file: DocumentFile | undefined) => void,
): Promise<void> {
  try {
    const picked = await pickDocument(source, nameHint);
    if (picked) onChange(picked);
  } catch (error: unknown) {
    const message =
      error instanceof PickerPermissionError ? error.message : 'Could not open the picker. Please try again.';
    void dialog.error({ title: 'Photo not added', message });
  }
}
