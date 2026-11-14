import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Gauge } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dialog } from '@/components/dialog/dialog';
import { AppText, Button, Card, IconTile, TextField } from '@/components/ui';
import { pickDocument, PickerPermissionError } from '@/features/register/documentPicker';
import type { DocumentFile } from '@/features/register/leadForm';
import { cleanKmInput, parseEndKm, parseStartKm } from '@/features/shift/odometer';
import { settleOdometer } from '@/features/shift/odometerBridge';
import { useColors } from '@/theme';
import { haptics } from '@/utils/haptics';

const PHOTO_HEIGHT = 200;

/**
 * Step one of attendance, and the last step of ending a shift: the rider types the reading on the vehicle's
 * odometer and photographs it. Only the camera is offered (no gallery), so the picture is taken now, at the vehicle.
 * At the end of a shift the reading cannot be lower than the one entered at the start.
 */
export default function OdometerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; startKm?: string }>();
  const isEnd = params.mode === 'end';
  const startKm = params.startKm && Number(params.startKm) > 0 ? Number(params.startKm) : null;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [kmText, setKmText] = useState('');
  const [photo, setPhoto] = useState<DocumentFile | null>(null);
  const [kmError, setKmError] = useState<string | null>(null);

  // Closing the screen any other way (back button, swipe) must still answer the waiting attendance flow.
  useEffect(() => () => settleOdometer(null), []);

  async function takePhoto() {
    try {
      const file = await pickDocument('camera', 'odometer');
      if (file) setPhoto(file);
    } catch (error: unknown) {
      const message = error instanceof PickerPermissionError ? error.message : 'Could not open the camera. Please try again.';
      void dialog.error({ title: 'Photo not added', message });
    }
  }

  function next() {
    const parsed = isEnd ? parseEndKm(kmText, startKm) : parseStartKm(kmText);
    if (!parsed.ok) {
      haptics.error();
      setKmError(parsed.error);
      return;
    }
    if (!photo) {
      haptics.error();
      void dialog.error({ title: 'Photo needed', message: 'Take a clear photo of the odometer showing the reading.' });
      return;
    }
    settleOdometer({ km: parsed.km, photo });
    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior="padding">
      <Stack.Screen options={{ headerShown: true, title: isEnd ? 'End odometer' : 'Vehicle odometer' }} />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center gap-3">
          <IconTile icon={Gauge} tone="assigned" size={24} tileSize={52} />
          <View className="flex-1">
            <AppText variant="h2">{isEnd ? 'End of shift' : 'Start of shift'}</AppText>
            <AppText tone="muted">
              {isEnd && startKm !== null
                ? `Your start reading was ${startKm} km. Enter your odometer reading now and take a photo of it.`
                : 'Enter your odometer reading and take a photo of it.'}
            </AppText>
          </View>
        </View>

        <Card className="gap-4">
          <TextField
            label="Odometer reading (km)"
            value={kmText}
            onChangeText={(value) => {
              setKmText(cleanKmInput(value));
              setKmError(null);
            }}
            keyboardType="decimal-pad"
            placeholder={isEnd && startKm !== null ? `e.g. ${startKm + 25}` : 'e.g. 12450'}
            leadingIcon={Gauge}
            error={kmError}
          />

          <View className="gap-1.5">
            <AppText variant="label">Odometer photo</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={photo ? 'Retake the odometer photo' : 'Take a photo of the odometer'}
              onPress={() => void takePhoto()}
              style={{
                height: PHOTO_HEIGHT,
                borderRadius: 16,
                borderWidth: 2,
                borderStyle: photo ? 'solid' : 'dashed',
                borderColor: photo ? colors.primary : colors.border,
                backgroundColor: colors.muted,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}>
              {photo ? (
                <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <>
                  <Camera size={32} color={colors.mutedForeground} />
                  <AppText tone="muted">Tap to take a photo</AppText>
                </>
              )}
            </Pressable>
            {photo ? (
              <AppText variant="caption" tone="muted">
                Tap the photo to retake it.
              </AppText>
            ) : (
              <AppText variant="caption" tone="muted">
                Make sure every digit of the reading is sharp and readable.
              </AppText>
            )}
          </View>
        </Card>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        }}>
        <Button label={isEnd ? 'End shift' : 'Continue to selfie'} onPress={next} />
      </View>
    </KeyboardAvoidingView>
  );
}
