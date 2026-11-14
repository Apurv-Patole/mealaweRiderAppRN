import { Image, View } from 'react-native';

import { SvgXml } from '@/components/ThemedSvg';
import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';

import { DELIVER_COLORS } from '../deliverTheme';
import { houseDoorSvg, photoCheckSvg } from '../ui/deliverSvgSources';

interface PhotoViewfinderProps {
  /** The photo the rider just took, or null while there is none (a house icon stands in). */
  photoUri: string | null;
  /** "2:58 PM · Balewadi Phata". */
  caption: string;
  height?: number;
}

/**
 * The delivery photo card: a dark frame with a "Photo taken" badge top-left and a time and place chip bottom-right.
 * The frame is dark in both light and dark mode, as the photo sits on it.
 */
export function PhotoViewfinder({ photoUri, caption, height = 340 }: PhotoViewfinderProps) {
  const c = DELIVER_COLORS;
  return (
    <View
      accessibilityLabel={photoUri ? 'Delivery photo taken' : 'No delivery photo yet'}
      style={{
        height,
        padding: 14,
        justifyContent: 'space-between',
        borderRadius: 20,
        backgroundColor: c.frame,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} resizeMode="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      ) : (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 156, height: 156, borderRadius: 24, backgroundColor: c.tile, alignItems: 'center', justifyContent: 'center' }}>
            <SvgXml xml={houseDoorSvg} width={48} height={48} />
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row' }}>
        {photoUri ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: c.badgeBg }}>
            <SvgXml xml={photoCheckSvg} width={14} height={14} raw />
            <AppText variant="caption" style={{ color: c.badgeInk, fontFamily: FONT_FAMILY.medium, fontSize: 12, lineHeight: 16 }}>
              Photo taken
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: c.chipBg }}>
          <AppText variant="caption" style={{ color: c.chipInk, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
            {caption}
          </AppText>
        </View>
      </View>
    </View>
  );
}
