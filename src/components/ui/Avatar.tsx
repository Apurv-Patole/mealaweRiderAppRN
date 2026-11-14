import { View } from 'react-native';

import { useColors } from '@/theme';

import { AppText } from './AppText';

interface AvatarProps {
  name: string;
  size?: number;
}

/** First letters of up to two words of a name: "Ravi Kumar" gives "RK". */
export function initialsOf(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase());
  return letters.join('') || 'R';
}

/** A round badge with the rider's initials, in the brand colour. */
export function Avatar({ name, size = 64 }: AvatarProps) {
  const colors = useColors();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <AppText variant="h2" style={{ color: colors.primaryForeground, fontSize: size * 0.36, lineHeight: size * 0.46 }}>
        {initialsOf(name)}
      </AppText>
    </View>
  );
}
