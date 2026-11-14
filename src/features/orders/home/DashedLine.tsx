import { View, type ViewStyle } from 'react-native';

interface DashedLineProps {
  color: string;
  /** Run top to bottom instead of left to right. */
  vertical?: boolean;
  /** Thickness across the line, in points. */
  thickness?: number;
  /** Length of one dash (and of one gap), in points. */
  dash?: number;
  /** How many dash-and-gap pairs to draw; the container clips whatever does not fit. */
  pairs?: number;
  style?: ViewStyle;
}

/** A dashed line made of alternating dashes and gaps, because a one-sided dashed border is not reliable on Android. */
export function DashedLine({ color, vertical = false, thickness = 2, dash = 8, pairs = 14, style }: DashedLineProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        { overflow: 'hidden', flexDirection: vertical ? 'column' : 'row' },
        vertical ? { width: thickness } : { height: thickness },
        style,
      ]}>
      {Array.from({ length: pairs * 2 }, (_, index) => (
        <View
          key={index}
          style={{
            width: vertical ? thickness : dash,
            height: vertical ? dash : thickness,
            // Even slots are dashes; odd slots stay transparent and form the gaps.
            backgroundColor: index % 2 === 0 ? color : 'transparent',
          }}
        />
      ))}
    </View>
  );
}
