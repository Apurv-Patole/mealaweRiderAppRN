import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { useStatusColors, type StatusTone } from '@/theme';

interface IconTileProps {
  icon: LucideIcon;
  /** Picks the hue and its soft background from the status palette. */
  tone?: StatusTone;
  /** Glyph size in px. */
  size?: number;
  /** Tile size in px. */
  tileSize?: number;
}

/** A coloured icon on a soft tinted tile: gives rows and cards a visual anchor without extra text. */
export function IconTile({ icon: Icon, tone = 'assigned', size = 20, tileSize = 40 }: IconTileProps) {
  const colors = useStatusColors(tone);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: tileSize,
        height: tileSize,
        borderRadius: tileSize * 0.3,
        backgroundColor: colors.soft,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon size={size} color={colors.ink} strokeWidth={2} />
    </View>
  );
}
