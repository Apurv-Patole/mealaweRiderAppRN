import { Image, View } from 'react-native';

const LOGO = require('../../../assets/images/icon.png') as number;

interface BrandMarkProps {
  size?: number;
}

/** The Mealawe Rider app mark (scooter rider), used on the first screens a rider sees. */
export function BrandMark({ size = 72 }: BrandMarkProps) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Mealawe Rider logo"
      style={{ width: size, height: size, borderRadius: size * 0.24, overflow: 'hidden' }}>
      <Image source={LOGO} style={{ width: size, height: size }} resizeMode="cover" />
    </View>
  );
}
