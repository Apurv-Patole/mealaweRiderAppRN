import { useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AppText } from '@/components/ui';
import { DemoHeroPill } from '@/features/demo/DemoHeroPill';
import { FONT_FAMILY } from '@/theme';

import { heroInitials, heroPhone, heroRoute } from '../profileHero';
import { HERO_FIXED } from '../profileTheme';
import { useProfileColors } from '../useProfileColors';

interface ProfileHeroProps {
  name: string;
  phoneNo: string | null | undefined;
  routeNo: string | null | undefined;
  isActive: boolean;
  topInset: number;
}

const MIN_TOP_INSET = 24;
const AVATAR = 96;
/** Figma's glow fades to clear at 70% of a 226 px radius, so it reaches past the 320 px box's edge. */
const GLOW_RADIUS = 226;

function Pill({ dot, dotSize, label, bg, ink, border }: { dot: string; dotSize: number; label: string; bg: string; ink: string; border?: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: bg,
        borderWidth: border ? 1 : 0,
        borderColor: border,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: border ? 2 : 1,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}>
      <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dot }} />
      <AppText variant="caption" style={{ color: ink, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
        {label}
      </AppText>
    </View>
  );
}

/** The green hero: a soft gradient with two faint circles, the avatar ring, name, phone and status pills. */
export function ProfileHero({ name, phoneNo, routeNo, isActive, topInset }: ProfileHeroProps) {
  const c = useProfileColors();
  const phone = heroPhone(phoneNo);
  const route = heroRoute(routeNo);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  return (
    <View
      onLayout={onLayout}
      style={{
        paddingTop: Math.max(topInset, MIN_TOP_INSET) + 16,
        paddingBottom: 64,
        paddingHorizontal: 16,
        gap: 8,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
        backgroundColor: c.heroMid,
      }}>
      {size.width > 0 ? (
        <Svg width={size.width} height={size.height} style={{ position: 'absolute', top: 0, left: 0 }}>
          <Defs>
            <LinearGradient id="hero" x1="0.4" y1="0" x2="0.6" y2="1">
              <Stop offset="0" stopColor={c.heroFrom} />
              <Stop offset="0.45" stopColor={c.heroMid} />
              <Stop offset="1" stopColor={c.heroTo} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={size.width} height={size.height} fill="url(#hero)" />
        </Svg>
      ) : null}

      <View pointerEvents="none" style={{ position: 'absolute', right: -80, top: -120, width: 320, height: 320 }}>
        <Svg width={320} height={320}>
          <Defs>
            <RadialGradient id="glow" cx="160" cy="160" r={GLOW_RADIUS} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={HERO_FIXED.demoLime} stopOpacity="0.12" />
              <Stop offset="0.7" stopColor={HERO_FIXED.demoLime} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="320" height="320" fill="url(#glow)" />
        </Svg>
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', bottom: -110, left: -90, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.05)' }} />

      <DemoHeroPill />

      <View style={{ alignItems: 'center' }}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            marginTop: 8,
            width: AVATAR,
            height: AVATAR,
            borderRadius: AVATAR / 2,
            borderWidth: 3,
            borderColor: HERO_FIXED.avatarBorder,
            backgroundColor: HERO_FIXED.avatarBg,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000000',
            shadowOpacity: 0.1,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}>
          <AppText style={{ color: HERO_FIXED.text, fontFamily: FONT_FAMILY.bold, fontSize: 30, lineHeight: 36, letterSpacing: 1.5 }}>{heroInitials(name)}</AppText>
        </View>

        <AppText accessibilityRole="header" style={{ marginTop: 12, color: HERO_FIXED.text, fontFamily: FONT_FAMILY.bold, fontSize: 20, lineHeight: 28, letterSpacing: -0.5 }}>
          {name}
        </AppText>
        {phone ? (
          <AppText style={{ marginTop: 2, color: HERO_FIXED.phone, fontSize: 14, lineHeight: 20, letterSpacing: 0.35 }}>{phone}</AppText>
        ) : null}

        <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
          <Pill
            dot={isActive ? HERO_FIXED.activeDot : HERO_FIXED.inactiveDot}
            dotSize={10}
            label={isActive ? 'Active' : 'Inactive'}
            bg={HERO_FIXED.activePillBg}
            ink={HERO_FIXED.activePillInk}
          />
          {route ? (
            <Pill dot={HERO_FIXED.routeDot} dotSize={8} label={route} bg={HERO_FIXED.routePillBg} ink={HERO_FIXED.routePillInk} border={HERO_FIXED.routePillBorder} />
          ) : null}
        </View>
      </View>
    </View>
  );
}
