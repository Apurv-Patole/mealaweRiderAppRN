import { Linking, Pressable, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { mapsDirectionsUrl } from '@/lib/geo';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';

import { navArrowSvg } from '../home/detailSvgSources';
import { HOME_METRICS } from '../home/homeTheme';
import type { RiderOrder } from '../orderModel';
import { nextStep } from '../orderProgress';
import { useDetailColors, useHomeColors } from '@/features/orders/home/useHomeColors';

/** The one thing to do next, on a deep-green card with a Navigate button to the right place. */
export function NextStepCard({ order }: { order: RiderOrder }) {
  const D = useDetailColors();
  const C = useHomeColors();
  const step = nextStep({ statusKey: order.statusKey, lifecycle: order.lifecycle, kitchen: order.kitchen, customer: order.customer });
  const target = step.navigateTo === 'kitchen' ? order.kitchen.location : step.navigateTo === 'customer' ? order.customer.location : null;
  const muted = order.lifecycle === 'cancelled';

  return (
    <View
      style={{
        padding: 16,
        gap: 4,
        borderRadius: HOME_METRICS.radius,
        backgroundColor: muted ? C.initialsBg : D.nextCard,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 1,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}>
      <AppText variant="caption" style={{ color: muted ? D.subtle : D.nextEyebrow, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 18 }}>
        {step.eyebrow}
      </AppText>
      <AppText variant="h2" style={{ color: muted ? C.ink : C.onGreen, fontFamily: FONT_FAMILY.bold, fontSize: 20, lineHeight: 27.5, letterSpacing: -0.5 }}>
        {step.title}
      </AppText>
      <AppText style={{ color: muted ? D.subtle : D.nextBody, fontSize: 13, lineHeight: 21.13, paddingTop: 1 }}>{step.subtitle}</AppText>
      {target ? (
        <View style={{ paddingTop: 12, alignItems: 'flex-start' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={step.navigateTo === 'kitchen' ? 'Navigate to the kitchen' : 'Navigate to the customer'}
            onPress={() => {
              haptics.tap();
              void Linking.openURL(mapsDirectionsUrl(target));
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6.5,
              paddingLeft: 18.5,
              paddingRight: 20,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: C.card,
              opacity: pressed ? 0.88 : 1,
            })}>
            <View style={{ width: 19, height: 19, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-12deg' }] }}>
              <SvgXml xml={navArrowSvg} width={16} height={16} />
            </View>
            <AppText style={{ color: C.greenInk, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 21 }}>Navigate</AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
