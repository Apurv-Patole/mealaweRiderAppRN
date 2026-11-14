import { View, type ViewStyle } from 'react-native';

import { DIAL } from './heroLayout';
import { useOnboardingColors } from '@/features/onboarding/useOnboardingColors';

const FACE = DIAL.face;
const CAP = 18;
/** Pivot cap sits left of and above the face centre; measured from the Figma padding (83 / 91). */
const CAP_LEFT = 83;
const CAP_TOP = 91;

/** One diagonal tick: a 2.5 x 10 bar rotated about the centre of a small box pinned near a corner. */
function DiagonalTick({ box, angle }: { box: ViewStyle; angle: '45deg' | '-45deg' }) {
  const C = useOnboardingColors();
  return (
    <View style={[{ position: 'absolute', width: 8.839, height: 8.839, alignItems: 'center', justifyContent: 'center' }, box]}>
      <View style={{ width: 2.5, height: 10, borderRadius: 999, backgroundColor: C.tick, transform: [{ rotate: angle }] }} />
    </View>
  );
}

/**
 * The clock face from the slide-1 hero: a bold green ring, white face, hour ticks and a hand pointing
 * to a start time. Built from views (not an image) so it stays crisp and themable.
 */
export function ShiftDial() {
  const C = useOnboardingColors();
  const pill = { position: 'absolute', backgroundColor: C.tick, borderRadius: 999 } as const;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        left: DIAL.left,
        top: DIAL.top,
        width: DIAL.size,
        height: DIAL.size,
        borderRadius: DIAL.size / 2,
        backgroundColor: C.green,
        padding: DIAL.ring,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 1,
        shadowOffset: { width: 0, height: 1 },
      }}>
      <View style={{ width: FACE, height: FACE, borderRadius: FACE / 2, backgroundColor: C.sheet }}>
        <View style={[pill, { width: 3, height: 13, top: 2, left: (FACE - 3) / 2 }]} />
        <View style={[pill, { width: 3, height: 13, bottom: 2, left: (FACE - 3) / 2 }]} />
        <View style={[pill, { width: 13, height: 3, left: 2, top: (FACE - 3) / 2 }]} />
        <View style={[pill, { width: 13, height: 3, right: 2, top: (FACE - 3) / 2 }]} />
        <DiagonalTick box={{ left: 28.83, top: 28.58 }} angle="-45deg" />
        <DiagonalTick box={{ right: 28.83, top: 28.58 }} angle="45deg" />
        <DiagonalTick box={{ left: 28.83, bottom: 28.58 }} angle="45deg" />
        <DiagonalTick box={{ right: 28.83, bottom: 28.58 }} angle="-45deg" />

        <View style={{ position: 'absolute', left: CAP_LEFT, top: CAP_TOP, width: CAP, height: CAP }}>
          {/* Hand: 34 x 7 bar, centre at (13.4, 11.1) from the cap's origin, turned 42 degrees. */}
          <View
            style={{
              position: 'absolute',
              left: 13.375 - 17,
              top: 11.126 - 3.5,
              width: 34,
              height: 7,
              borderRadius: 999,
              backgroundColor: C.greenDeep,
              transform: [{ rotate: '42deg' }],
            }}
          />
          <View style={{ width: CAP, height: CAP, borderRadius: CAP / 2, backgroundColor: C.greenDeep }} />
        </View>
      </View>
    </View>
  );
}
