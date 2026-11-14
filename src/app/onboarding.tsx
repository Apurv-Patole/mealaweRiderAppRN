import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Animated, Pressable, View, useWindowDimensions, type FlatList, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { HeroStage, type HeroMetrics } from '@/features/onboarding/art/HeroStage';
import { HERO_HEIGHT, SHEET_HEIGHT, heroOffsetX, heroScale } from '@/features/onboarding/art/heroLayout';
import { RiderLogo } from '@/features/onboarding/art/RiderLogo';
import { SLIDE_ART } from '@/features/onboarding/art/slideArt';
import { ONBOARDING_SLIDES, type OnboardingSlide } from '@/features/onboarding/slides';
import { useAppFlagsStore } from '@/store';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';
import { useOnboardingColors } from '@/features/onboarding/useOnboardingColors';

const DOT = 8;
const DOT_ACTIVE = 24;
const CTA_HEIGHT = 48;
const SHEET_PAD_TOP = 36;
const SHEET_PAD_X = 16;
const MIN_BOTTOM_PAD = 16;

/** One page of the pager: this slide's map and hero art. The sheet and its copy are drawn separately, on top. */
function SlideArtPage({ slide, width, height, metrics }: { slide: OnboardingSlide; width: number; height: number; metrics: HeroMetrics }) {
  const C = useOnboardingColors();
  const { background, Backdrop, Hero } = SLIDE_ART[slide.icon];
  return (
    <View style={{ width, height, backgroundColor: C[background], overflow: 'hidden' }}>
      <HeroStage metrics={metrics}>
        <Backdrop />
        <Hero />
      </HeroStage>
    </View>
  );
}

export default function OnboardingScreen() {
  const C = useOnboardingColors();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useAppFlagsStore((state) => state.completeOnboarding);
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [scrollX] = useState(() => new Animated.Value(0));
  const [index, setIndex] = useState(0);

  const isLast = index === ONBOARDING_SLIDES.length - 1;
  const bottomPad = Math.max(MIN_BOTTOM_PAD, insets.bottom);
  const sheetHeight = SHEET_HEIGHT - MIN_BOTTOM_PAD + bottomPad;
  const heroHeight = height - sheetHeight;

  const scale = heroScale(width, heroHeight);
  // Anchor the art to the sheet so any spare height opens up at the top, behind the header.
  const metrics: HeroMetrics = { scale, left: heroOffsetX(width, scale), top: heroHeight - HERO_HEIGHT * scale };

  function goTo(target: number) {
    listRef.current?.scrollToOffset({ offset: target * width, animated: true });
    setIndex(target);
  }

  // The settled page comes from the final scroll offset, not from viewability: it can never lag or flicker.
  function onSettled(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(Math.min(Math.max(page, 0), ONBOARDING_SLIDES.length - 1));
  }

  function next() {
    if (isLast) {
      haptics.confirm();
      completeOnboarding();
      return;
    }
    haptics.tap();
    goTo(index + 1);
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <StatusBar style="auto" />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: sheetHeight,
          backgroundColor: C.sheet,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          shadowColor: '#000000',
          shadowOpacity: 0.04,
          shadowRadius: 15,
          shadowOffset: { width: 0, height: -8 },
          elevation: 8,
        }}
      />

      <Animated.FlatList
        ref={listRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(slide) => slide.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={onSettled}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => <SlideArtPage slide={item} width={width} height={height} metrics={metrics} />}
      />

      {/* White sheet and its copy sit above the art. Both ignore touches so a swipe anywhere still pages the art. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: sheetHeight,
          backgroundColor: C.sheet,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          shadowColor: '#000000',
          shadowOpacity: 0.04,
          shadowRadius: 15,
          shadowOffset: { width: 0, height: -8 },
          elevation: 8,
        }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: heroHeight, height: sheetHeight, overflow: 'hidden' }}>
        {ONBOARDING_SLIDES.map((slide, i) => (
          <Animated.View
            key={slide.id}
            style={{
              position: 'absolute',
              left: 0,
              top: SHEET_PAD_TOP,
              width,
              paddingHorizontal: SHEET_PAD_X,
              transform: [{ translateX: Animated.add(Animated.multiply(scrollX, -1), i * width) }],
            }}>
            <AppText
              variant="display"
              style={{ color: C.ink, fontSize: 25, lineHeight: 34.38, letterSpacing: -0.625, textAlign: 'center' }}>
              {slide.title}
            </AppText>
            <AppText
              style={{ color: C.muted, fontSize: 14, lineHeight: 22.75, textAlign: 'center', marginTop: 11.375, paddingHorizontal: 8 }}>
              {slide.body}
            </AppText>
          </Animated.View>
        ))}
      </View>

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: 0, right: 0, top: insets.top, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
        <RiderLogo />
        {!isLast ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            hitSlop={8}
            onPress={completeOnboarding}
            style={{ minHeight: 48, minWidth: 48, alignItems: 'flex-end', justifyContent: 'center' }}>
            <AppText style={{ color: C.greenInk, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 21, letterSpacing: 0.35 }}>Skip</AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingBottom: bottomPad }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          accessibilityLabel={`Page ${index + 1} of ${ONBOARDING_SLIDES.length}`}>
          {ONBOARDING_SLIDES.map((slide, i) => {
            const input = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({ inputRange: input, outputRange: [DOT, DOT_ACTIVE, DOT], extrapolate: 'clamp' });
            const fill = scrollX.interpolate({ inputRange: input, outputRange: [0, 1, 0], extrapolate: 'clamp' });
            return (
              <Pressable key={slide.id} accessibilityRole="button" accessibilityLabel={`Go to page ${i + 1}`} hitSlop={12} onPress={() => goTo(i)}>
                <Animated.View style={{ height: DOT, width: dotWidth, borderRadius: DOT / 2, backgroundColor: C.dotIdle, overflow: 'hidden' }}>
                  <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, opacity: fill, backgroundColor: C.green }} />
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Get Started' : 'Next'}
          onPress={next}
          style={({ pressed }) => ({
            marginTop: 28,
            height: CTA_HEIGHT,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: C.green,
            opacity: pressed ? 0.88 : 1,
          })}>
          <AppText style={{ color: C.onGreen, fontFamily: FONT_FAMILY.bold, fontSize: 15, lineHeight: 22.5 }}>
            {isLast ? 'Get Started' : 'Next'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
