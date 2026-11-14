import { MapPin } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui';

const WHITE = '#ffffff';

interface SelfieStampProps {
  lines: readonly string[];
  /** Space under the stamp, to clear the buttons that sit below the photo. */
  bottomInset: number;
}

/** The time and GPS text printed at the bottom of the selfie, on a dark band so it reads on any photo. */
export function SelfieStamp({ lines, bottomInset }: SelfieStampProps) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: bottomInset,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.55)',
      }}>
      <MapPin size={16} color={WHITE} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        {lines.map((line, index) => (
          <AppText
            key={line}
            variant={index === 0 ? 'label' : 'caption'}
            numberOfLines={2}
            style={{ color: WHITE }}>
            {line}
          </AppText>
        ))}
      </View>
    </View>
  );
}
