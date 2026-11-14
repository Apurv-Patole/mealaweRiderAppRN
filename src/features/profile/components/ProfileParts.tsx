import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui';
import { useHomeColors, useOrderPill } from '@/features/orders/home/useHomeColors';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';

import type { ProfileColors } from '../profileTheme';
import { useProfileColors } from '../useProfileColors';

export type TileTone = 'edit' | 'wallet' | 'mint' | 'blue';

function tileColors(c: ProfileColors, tone: TileTone): { bg: string; border: string; icon: string } {
  switch (tone) {
    case 'edit':
      return { bg: c.editTileBg, border: c.editTileBorder, icon: c.editTileIcon };
    case 'wallet':
      return { bg: c.walletTileBg, border: c.walletTileBorder, icon: c.walletTileIcon };
    case 'blue':
      return { bg: c.blueTileBg, border: c.blueTileBorder, icon: c.blueTileIcon };
    default:
      return { bg: c.mintTileBg, border: c.mintTileBorder, icon: c.mintTileIcon };
  }
}

/** A white rounded card with the hairline border and soft shadow used all over the Profile tab. */
export function ProfileCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const home = useHomeColors();
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: home.border,
        backgroundColor: home.card,
        overflow: 'hidden',
        shadowColor: '#171c19',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
        ...style,
      }}>
      {children}
    </View>
  );
}

/** A section heading: "My work", "App permissions". */
export function SectionHeading({ children }: { children: string }) {
  const home = useHomeColors();
  return (
    <AppText accessibilityRole="header" style={{ paddingHorizontal: 4, color: home.ink, fontFamily: FONT_FAMILY.bold, fontSize: 16, lineHeight: 24 }}>
      {children}
    </AppText>
  );
}

interface ProfileRowProps {
  icon: LucideIcon;
  tone: TileTone;
  title: string;
  subtitle: string;
  /** Tile size: 48 for the Edit profile card, 44 for the rows. */
  tile?: number;
  onPress: () => void;
  /** Hairline above the row (every row after the first in a card). */
  divider?: boolean;
  padding?: number;
}

/** A tappable row: tinted icon tile, title and subtitle, and a chevron. */
export function ProfileRow({ icon: Icon, tone, title, subtitle, tile = 44, onPress, divider = false, padding = 14 }: ProfileRowProps) {
  const home = useHomeColors();
  const c = useProfileColors();
  const look = tileColors(c, tone);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding,
        borderTopWidth: divider ? 1 : 0,
        borderTopColor: home.border,
        opacity: pressed ? 0.85 : 1,
      })}>
      <View style={{ width: tile, height: tile, borderRadius: 12, borderWidth: 1, borderColor: look.border, backgroundColor: look.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={look.icon} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText style={{ color: home.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 14, lineHeight: 17.5 }}>{title}</AppText>
        <AppText variant="caption" style={{ marginTop: 2, color: home.muted, fontSize: 12, lineHeight: 16 }}>
          {subtitle}
        </AppText>
      </View>
      <ChevronRight size={20} color={c.chevron} />
    </Pressable>
  );
}

export type ChipTone = 'done' | 'cancelled' | 'ready' | 'offline';

/** The status chip on a permission line: a dot and a word ("Allowed", "Blocked"). */
export function PermissionChip({ tone, label }: { tone: ChipTone; label: string }) {
  const c = useProfileColors();
  const pill = useOrderPill();
  const look = tone === 'done' ? { bg: c.allowedBg, ink: c.allowedInk } : pill[tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: look.bg }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: look.ink }} />
      <AppText variant="caption" style={{ color: look.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 11, lineHeight: 16 }}>
        {label}
      </AppText>
    </View>
  );
}

interface AppearanceTabsProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** The System / Light / Dark switch: a pale track with a white thumb under the chosen option. */
export function AppearanceTabs<T extends string>({ options, value, onChange }: AppearanceTabsProps<T>) {
  const c = useProfileColors();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', padding: 6, borderRadius: 16, backgroundColor: c.trackBg }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              haptics.tap();
              onChange(option.value);
            }}
            style={{
              flex: 1,
              minHeight: 40,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: selected ? c.thumbBg : 'transparent',
              shadowColor: '#000000',
              shadowOpacity: selected ? 0.05 : 0,
              shadowRadius: 1,
              shadowOffset: { width: 0, height: 1 },
              elevation: selected ? 1 : 0,
            }}>
            <AppText style={{ color: selected ? c.thumbInk : c.trackInk, fontFamily: selected ? FONT_FAMILY.bold : FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
