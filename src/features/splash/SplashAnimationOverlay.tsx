import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SPLASH } from '@/config/constants';

/**
 * The handoff screen shown right after the native (static, solid-colour) launch screen comes down:
 * a full-bleed once-through Lottie over the same `SPLASH.backgroundColor`, so the swap is invisible.
 * Finishes when the animation ends, fails to load, or after `SPLASH.timeoutMs`, so a broken asset
 * can never strand a rider on this screen.
 */
export function SplashAnimationOverlay({ onFinished }: { onFinished: () => void }) {
  const [hasError, setHasError] = useState(false);
  const finishedRef = useRef(false);

  const finishOnce = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinished();
  }, [onFinished]);

  useEffect(() => {
    const timeout = setTimeout(finishOnce, SPLASH.timeoutMs);
    return () => clearTimeout(timeout);
  }, [finishOnce]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.background]}>
      {!hasError && (
        <LottieView
          source={require('@/assets/lottie/rider-splash.json')}
          autoPlay
          loop={false}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
          onAnimationFinish={finishOnce}
          onAnimationFailure={() => {
            setHasError(true);
            finishOnce();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: SPLASH.backgroundColor },
});
