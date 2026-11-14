import { ArrowLeft, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/theme/palette';
import { useColors } from '@/theme';

import { AppText } from './AppText';
import { BrandMark } from './BrandMark';

const HERO_TEXT = '#ffffff';
const HERO_SOFT = 'rgba(255,255,255,0.85)';
const HERO_CHIP = 'rgba(255,255,255,0.16)';
const HERO_CHIP_BORDER = 'rgba(255,255,255,0.24)';
const SHEET_OVERLAP = 28;

export interface HeroPerk {
  icon: LucideIcon;
  label: string;
}

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  perks?: readonly HeroPerk[];
  /** A short line above the title, for example "Step 2 of 4". */
  eyebrow?: string;
  /** Hide the large logo badge on screens that need more room for the form. */
  compact?: boolean;
  /** Shows a round back button at the top left of the hero. */
  onBack?: () => void;
  children: ReactNode;
}

/**
 * Sign-in and apply-to-join screens share this frame: a brand-green hero (logo, title, perks) with a
 * rounded sheet that slides up over it and holds the form. The hero stays green in dark mode too.
 */
export function AuthLayout({ title, subtitle, perks = [], eyebrow, compact = false, onBack, children }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior="padding">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View
          style={{
            backgroundColor: palette.brand.primary,
            paddingTop: insets.top + (compact ? 16 : 28),
            paddingBottom: SHEET_OVERLAP + (compact ? 20 : 32),
            paddingHorizontal: 24,
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
            overflow: 'hidden',
          }}>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -70,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: 'rgba(255,255,255,0.10)',
            }}
          />

          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={onBack}
              hitSlop={8}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                marginBottom: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? 'rgba(255,255,255,0.28)' : HERO_CHIP,
                borderWidth: 1,
                borderColor: HERO_CHIP_BORDER,
              })}>
              <ArrowLeft size={22} color={HERO_TEXT} />
            </Pressable>
          ) : null}
          {compact ? null : <BrandMark size={64} />}
          {eyebrow ? (
            <AppText variant="label" style={{ color: HERO_SOFT, marginTop: compact ? 0 : 18 }}>
              {eyebrow}
            </AppText>
          ) : null}
          <AppText variant="display" style={{ color: HERO_TEXT, marginTop: eyebrow || compact ? 4 : 18 }}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText style={{ color: HERO_SOFT, marginTop: 6, maxWidth: 300 }}>{subtitle}</AppText>
          ) : null}

          {perks.length > 0 ? (
            <View className="mt-5 flex-row flex-wrap" style={{ gap: 8 }}>
              {perks.map(({ icon: Icon, label }) => (
                <View
                  key={label}
                  className="flex-row items-center"
                  style={{
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: HERO_CHIP,
                    borderWidth: 1,
                    borderColor: HERO_CHIP_BORDER,
                  }}>
                  <Icon size={14} color={HERO_TEXT} />
                  <AppText variant="caption" style={{ color: HERO_TEXT }}>
                    {label}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View
          style={{
            flex: 1,
            marginTop: -SHEET_OVERLAP,
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: insets.bottom + 24,
            gap: 16,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: colors.background,
          }}>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
