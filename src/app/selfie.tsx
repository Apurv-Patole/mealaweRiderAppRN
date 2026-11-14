import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { AppText, Button } from '@/components/ui';
import { SelfieStamp } from '@/features/shift/components/SelfieStamp';
import { currentSelfieContext, settleSelfie } from '@/features/shift/selfieBridge';
import { addressFromPlace, stampLines } from '@/features/shift/selfieStamp';
import { useNow } from '@/hooks/useNow';
import { haptics } from '@/utils/haptics';

const SELFIE_QUALITY = 0.6;
const STAMPED_QUALITY = 0.85;
const SHUTTER_SIZE = 76;
const SHUTTER_DOT = SHUTTER_SIZE - 20;
const WHITE = '#ffffff';
const ADDRESS_TIMEOUT_MS = 4_000;

/**
 * Full-screen front camera for the attendance selfie. The time and GPS position are printed on the photo
 * itself (the live view shows the same text), so the picture proves when and where it was taken.
 */
export default function SelfieScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cameraRef = useRef<CameraView>(null);
  const stampedRef = useRef<View>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState<Date | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [mountError, setMountError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  const location = currentSelfieContext()?.location ?? null;
  const now = useNow(1000, !photoUri);

  // Closing the screen any other way (back button, swipe) must still answer the waiting attendance flow.
  useEffect(() => () => settleSelfie(null), []);

  // The street or area is a nice extra on the stamp; the time and coordinates never wait for it.
  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    Promise.race([
      Location.reverseGeocodeAsync({ latitude: location.lat, longitude: location.lng }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ADDRESS_TIMEOUT_MS)),
    ])
      .then((places) => {
        if (!cancelled && places) setAddress(addressFromPlace(places[0]));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [location]);

  const guideSize = Math.min(width * 0.7, 300);
  const stampTime = capturedAt ?? new Date(now);
  const lines = location ? stampLines(stampTime, location, address) : [];

  async function capture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: SELFIE_QUALITY, exif: false, shutterSound: false });
      haptics.confirm();
      setCapturedAt(new Date());
      setPhotoUri(picture.uri);
    } catch {
      haptics.error();
    } finally {
      setCapturing(false);
    }
  }

  function retake() {
    setPhotoUri(null);
    setCapturedAt(null);
  }

  async function acceptPhoto() {
    if (!photoUri || !capturedAt || !stampedRef.current) return;
    setSaving(true);
    try {
      // Saves the photo together with the stamp text as one picture.
      const uri = await captureRef(stampedRef, { format: 'jpg', quality: STAMPED_QUALITY, result: 'tmpfile' });
      settleSelfie({ file: { uri, name: 'attendance-selfie.jpg', type: 'image/jpeg' }, capturedAt: capturedAt.toISOString() });
      router.back();
    } catch {
      haptics.error();
      setSaving(false);
    }
  }

  if (!permission) return <View style={styles.dark} />;

  if (!permission.granted) {
    return (
      <View style={[styles.dark, styles.center, { paddingTop: insets.top, paddingHorizontal: 24 }]}>
        <AppText variant="h2" className="text-center" style={styles.light}>
          Camera access needed
        </AppText>
        <AppText className="mt-2 text-center" style={styles.muted}>
          Your attendance selfie is taken with the front camera. Allow camera access to continue.
        </AppText>
        <View className="mt-6 w-full gap-3">
          <Button
            label={permission.canAskAgain ? 'Allow camera' : 'Open settings'}
            onPress={() => (permission.canAskAgain ? void requestPermission() : void Linking.openSettings())}
          />
          <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    // No opaque background on this container: the camera preview is drawn on a surface behind the window.
    <View style={styles.fill}>
      <View style={styles.fill}>
        {photoUri ? (
          <View ref={stampedRef} collapsable={false} style={[styles.fill, { backgroundColor: '#000000' }]}>
            <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <SelfieStamp lines={lines} bottomInset={0} />
          </View>
        ) : (
          <View style={styles.fill}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="front"
              mode="picture"
              animateShutter={false}
              onCameraReady={() => setReady(true)}
              onMountError={(event) => setMountError(event.message || 'The camera could not start.')}
            />
            {mountError ? (
              <View style={[styles.fill, styles.center, { paddingHorizontal: 32 }]}>
                <AppText className="text-center" style={styles.light}>
                  {mountError}
                </AppText>
                <AppText variant="caption" className="mt-2 text-center" style={styles.muted}>
                  Close this screen and try again. If it keeps happening, restart the app.
                </AppText>
              </View>
            ) : (
              <>
                <View pointerEvents="none" style={[styles.fill, styles.center]}>
                  <View
                    style={{
                      width: guideSize,
                      height: guideSize * 1.25,
                      borderRadius: guideSize,
                      borderWidth: 3,
                      borderColor: 'rgba(255,255,255,0.85)',
                      borderStyle: 'dashed',
                    }}
                  />
                </View>
                <SelfieStamp lines={lines} bottomInset={0} />
              </>
            )}
          </View>
        )}

        <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close camera"
            hitSlop={12}
            onPress={() => router.back()}
            style={styles.closeButton}>
            <X size={24} color={WHITE} />
          </Pressable>
          <AppText variant="label" style={styles.light}>
            {photoUri ? 'Check your selfie' : 'Attendance selfie'}
          </AppText>
          <View style={styles.closeButton} />
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        {photoUri ? (
          <View className="w-full flex-row gap-3 px-6">
            <View className="flex-1">
              <Button label="Retake" variant="outline" disabled={saving} onPress={retake} />
            </View>
            <View className="flex-1">
              <Button label="Use photo" loading={saving} onPress={() => void acceptPhoto()} />
            </View>
          </View>
        ) : (
          <>
            <AppText variant="caption" style={styles.muted}>
              Keep your face inside the outline
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Take selfie"
              disabled={!ready || capturing}
              onPress={() => void capture()}
              style={[styles.shutterRing, { opacity: ready ? 1 : 0.5 }]}>
              {capturing ? <ActivityIndicator color="#101214" /> : <View style={styles.shutterDot} />}
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  dark: { flex: 1, backgroundColor: '#000000' },
  center: { alignItems: 'center', justifyContent: 'center' },
  light: { color: WHITE },
  muted: { color: 'rgba(255,255,255,0.75)' },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bottom: {
    alignItems: 'center',
    gap: 14,
    paddingTop: 14,
    backgroundColor: '#000000',
  },
  shutterRing: {
    width: SHUTTER_SIZE,
    height: SHUTTER_SIZE,
    borderRadius: SHUTTER_SIZE / 2,
    borderWidth: 4,
    borderColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDot: { width: SHUTTER_DOT, height: SHUTTER_DOT, borderRadius: SHUTTER_DOT / 2, backgroundColor: WHITE },
});
