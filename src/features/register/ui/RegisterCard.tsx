import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';

import { REGISTER_METRICS } from './registerTheme';
import { useRegisterColors } from '@/features/register/ui/useRegisterColors';

interface RegisterCardProps {
  title: string;
  subtitle: string;
  icon: { xml: string; width: number; height: number };
  /** A small pill on the right of the header, for example "Required". */
  tag?: string;
  /** `green` for a positive label, `grey` for a neutral one. */
  tagTone?: 'green' | 'grey';
  /** Inner padding; 17 by default, 16 on the document cards. */
  padding?: number;
  /** Soft drop shadow under the card (the document cards are flat). */
  shadow?: boolean;
  children: ReactNode;
}

/** A white form card with a tinted icon tile, a title and subtitle, a divider and the fields below. */
export function RegisterCard({ title, subtitle, icon, tag, tagTone = 'green', padding, shadow = true, children }: RegisterCardProps) {
  const C = useRegisterColors();
  return (
    <View
      style={{
        padding: padding ?? REGISTER_METRICS.cardPadding,
        gap: REGISTER_METRICS.gap,
        borderRadius: REGISTER_METRICS.cardRadius,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.card,
        shadowColor: C.ink,
        shadowOpacity: shadow ? 0.04 : 0,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 2 },
        elevation: shadow ? 1 : 0,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 9, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            width: REGISTER_METRICS.tileSize,
            height: REGISTER_METRICS.tileSize,
            borderRadius: 8,
            backgroundColor: C.tile,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <SvgXml xml={icon.xml} width={icon.width} height={icon.height} />
        </View>
        <View style={{ flexShrink: 1 }}>
          <AppText variant="title" style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 16, lineHeight: 24 }}>
            {title}
          </AppText>
          <AppText variant="caption" style={{ color: C.muted, fontSize: 11, lineHeight: 16 }}>
            {subtitle}
          </AppText>
        </View>
        {tag ? (
          <View
            style={{
              marginLeft: 'auto',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor: tagTone === 'green' ? C.requiredTagBg : C.tagGrey,
            }}>
            <AppText
              variant="caption"
              style={{ color: tagTone === 'green' ? C.greenDeep : C.body, fontFamily: FONT_FAMILY.semibold, fontSize: 11, lineHeight: 16 }}>
              {tag}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={{ gap: REGISTER_METRICS.gap }}>{children}</View>
    </View>
  );
}
