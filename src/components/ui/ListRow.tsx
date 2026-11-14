import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { TOUCH, useColors, type StatusTone } from '@/theme';
import { haptics } from '@/utils/haptics';

import { AppText } from './AppText';
import { IconTile } from './IconTile';

interface ListRowProps {
  icon: LucideIcon;
  tone?: StatusTone;
  title: string;
  subtitle?: string;
  /** Replaces the chevron, for example a status chip. */
  trailing?: ReactNode;
  /** Makes the row tappable and shows a chevron. */
  onPress?: () => void;
}

/** One line in a settings-style list: icon tile, title and subtitle, then a chevron or a status. */
export function ListRow({ icon, tone, title, subtitle, trailing, onPress }: ListRowProps) {
  const colors = useColors();

  const content = (
    <View className="flex-row items-center gap-3" style={{ minHeight: TOUCH.min }}>
      <IconTile icon={icon} tone={tone} />
      <View className="flex-1">
        <AppText variant="label">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing ?? (onPress ? <ChevronRight size={20} color={colors.mutedForeground} /> : null)}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {content}
    </Pressable>
  );
}

/** A thin line between rows inside one card. */
export function RowDivider() {
  return <View className="my-3 h-px bg-border" />;
}
