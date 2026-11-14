import { Image, View } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';

import type { DocumentFile } from './leadForm';
import { pickAndReport } from './usePickDocument';

interface DocumentFieldProps {
  label: string;
  /** Becomes the uploaded file name. */
  nameHint: string;
  file: DocumentFile | undefined;
  onChange: (file: DocumentFile | undefined) => void;
}

const PREVIEW_HEIGHT = 140;

/** One document photo: preview, take a photo, choose from the gallery, remove. */
export function DocumentField({ label, nameHint, file, onChange }: DocumentFieldProps) {
  return (
    <Card className="gap-3">
      <AppText variant="label">{label}</AppText>
      {file ? (
        <Image
          source={{ uri: file.uri }}
          accessibilityLabel={`${label} preview`}
          style={{ height: PREVIEW_HEIGHT, borderRadius: 8 }}
          resizeMode="cover"
        />
      ) : (
        <AppText variant="caption" tone="muted">
          No photo added yet (optional).
        </AppText>
      )}
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button label="Take photo" size="md" variant="outline" onPress={() => void pickAndReport('camera', nameHint, onChange)} />
        </View>
        <View className="flex-1">
          <Button label="Gallery" size="md" variant="outline" onPress={() => void pickAndReport('library', nameHint, onChange)} />
        </View>
      </View>
      {file ? <Button label="Remove" size="md" variant="ghost" onPress={() => onChange(undefined)} /> : null}
    </Card>
  );
}
