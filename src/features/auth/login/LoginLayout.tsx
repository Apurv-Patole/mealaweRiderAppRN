import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';

import { LoginHero } from './LoginHero';
import { useLoginColors } from '@/features/auth/login/useLoginColors';

export interface LoginChip {
  iconXml: string;
  label: string;
}

interface LoginLayoutProps {
  title?: string;
  subtitle?: string;
  /** Replaces the title and subtitle block when a step needs richer text. */
  heading?: ReactNode;
  chips?: readonly LoginChip[];
  onBack: () => void;
  /** Form and its actions. */
  children: ReactNode;
  /** Pinned to the bottom of the screen when there is room, otherwise scrolls after the form. */
  footer?: ReactNode;
}

/** Sign-in frame from the design: dark hero, then title, benefit chips, the form and a footer of secondary actions. */
export function LoginLayout({ title, subtitle, heading, chips = [], onBack, children, footer }: LoginLayoutProps) {
  const C = useLoginColors();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.canvas }} behavior="padding">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <LoginHero onBack={onBack} />

        <View style={{ paddingHorizontal: 20, paddingTop: 34, gap: 16 }}>
          {heading ?? (
            <View style={{ gap: 4 }}>
              <AppText
                variant="display"
                style={{ color: C.ink, fontFamily: FONT_FAMILY.extrabold, fontSize: 30, lineHeight: 37.5, letterSpacing: -0.75 }}>
                {title}
              </AppText>
              <AppText style={{ color: C.muted, fontSize: 14, lineHeight: 22.75 }}>{subtitle}</AppText>
            </View>
          )}

          {chips.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {chips.map((chip, i) => (
                <View
                  key={chip.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: i === chips.length - 1 ? 'center' : 'flex-start',
                    flexGrow: i === chips.length - 1 ? 1 : 0,
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: C.chipBg,
                  }}>
                  <SvgXml xml={chip.iconXml} width={14} height={14} />
                  <AppText variant="caption" style={{ color: C.greenInk, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
                    {chip.label}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          <View style={{ gap: 16, marginTop: 8 }}>{children}</View>
        </View>

        <View style={{ flexGrow: 1 }} />
        {footer ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 28), gap: 16 }}>{footer}</View>
        ) : (
          <View style={{ height: Math.max(insets.bottom, 28) }} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
