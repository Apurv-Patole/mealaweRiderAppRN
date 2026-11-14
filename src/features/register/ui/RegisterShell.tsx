import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { RiderLogo } from '@/features/onboarding/art/RiderLogo';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';

import { progressLabel } from './registerContent';
import { progressPercent } from './registerFormat';
import { REGISTER_METRICS } from './registerTheme';
import { arrowRightSvg, backSvg } from './svgSources';
import { useRegisterColors } from '@/features/register/ui/useRegisterColors';

const MIN_TOP_INSET = 24;

interface RegisterShellProps {
  stepIndex: number;
  stepCount: number;
  title: string;
  subtitle: string;
  onBack: () => void;
  /** Optional reassurance strip under the heading (shown on the first step). */
  banner?: ReactNode;
  /** The form: cards and the legal line. */
  children: ReactNode;
  primaryLabel: string;
  primaryBusy?: boolean;
  onPrimary: () => void;
  /** The quiet line under the main button, for example "Already have an account? Sign in". */
  secondary: ReactNode;
}

/**
 * Frame for the registration steps: back button, logo and step pill on top, a progress strip, the heading,
 * the scrolling form, and a docked footer with the main action. The look follows the Figma "Reg (1)" screen.
 */
export function RegisterShell({
  stepIndex,
  stepCount,
  title,
  subtitle,
  onBack,
  banner,
  children,
  primaryLabel,
  primaryBusy = false,
  onPrimary,
  secondary,
}: RegisterShellProps) {
  const C = useRegisterColors();
  const insets = useSafeAreaInsets();
  const percent = progressPercent(stepIndex, stepCount);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.canvas }} behavior="padding">
      <View
        style={{
          paddingTop: Math.max(insets.top, MIN_TOP_INSET),
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={{
            width: REGISTER_METRICS.backSize,
            height: REGISTER_METRICS.backSize,
            borderRadius: REGISTER_METRICS.backSize / 2,
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: C.card,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <SvgXml xml={backSvg} width={20} height={20} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <RiderLogo />
          <View style={{ paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: C.canvas }}>
            <AppText variant="caption" style={{ color: C.body, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
              Step {stepIndex + 1} of {stepCount}
            </AppText>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: REGISTER_METRICS.gap }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={{ gap: 8, paddingTop: 4 }}>
          <AppText variant="caption" style={{ color: C.greenDeep, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16, textAlign: 'right' }}>
            {progressLabel(percent)}
          </AppText>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 1, max: stepCount, now: stepIndex + 1 }}
            style={{ flexDirection: 'row', gap: 6 }}>
            {Array.from({ length: stepCount }, (_, index) => (
              <View
                key={index}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  overflow: 'hidden',
                  backgroundColor: index < stepIndex ? C.green : index === stepIndex ? (stepIndex === 0 ? C.green : C.greenDeep) : C.progressOff,
                }}>
                {index === stepIndex && stepIndex > 0 ? (
                  <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0.5, backgroundColor: C.lime, opacity: 0.4 }} />
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: 4 }}>
          <AppText variant="display" style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 20, lineHeight: 32, letterSpacing: -0.6 }}>
            {title}
          </AppText>
          <AppText style={{ color: C.body, fontSize: 14, lineHeight: 20 }}>{subtitle}</AppText>
        </View>

        {banner}
        {children}
      </ScrollView>

      <View
        style={{
          paddingTop: 9,
          paddingHorizontal: 16,
          paddingBottom: Math.max(insets.bottom, 8),
          gap: 8,
          borderTopWidth: 1,
          borderTopColor: C.border,
          backgroundColor: C.card,
          shadowColor: C.ink,
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -4 },
          elevation: 8,
        }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}
          accessibilityState={{ disabled: primaryBusy, busy: primaryBusy }}
          disabled={primaryBusy}
          onPress={() => {
            haptics.tap();
            onPrimary();
          }}
          style={({ pressed }) => ({
            height: REGISTER_METRICS.buttonHeight,
            borderRadius: REGISTER_METRICS.buttonRadius,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: C.green,
            opacity: primaryBusy ? 0.6 : pressed ? 0.88 : 1,
          })}>
          <AppText style={{ color: C.onGreen, fontFamily: FONT_FAMILY.bold, fontSize: 15, lineHeight: 22.5 }}>
            {primaryBusy ? 'Please wait…' : primaryLabel}
          </AppText>
          {!primaryBusy ? <SvgXml xml={arrowRightSvg} width={16} height={16} /> : null}
        </Pressable>
        <View style={{ alignItems: 'center', paddingBottom: 4 }}>{secondary}</View>
      </View>
    </KeyboardAvoidingView>
  );
}
