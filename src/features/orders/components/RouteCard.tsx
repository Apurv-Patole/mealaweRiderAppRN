import { Linking, Pressable, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { formatClockFromIso } from '@/lib/dates';
import { mapsDirectionsUrl } from '@/lib/geo';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';

import { DashedLine } from '../home/DashedLine';
import { callSvg, clockSmallSvg, kitchenTileSvg, landmarkSvg, navigateCircleSvg, pinTileSvg, readyCheckSvg } from '../home/detailSvgSources';
import { HOME_METRICS } from '../home/homeTheme';
import type { OrderParty, RiderOrder } from '../orderModel';
import { isReadyForPickup } from '../lifecycle';
import { useDetailColors, useHomeColors } from '@/features/orders/home/useHomeColors';

const TILE = 40;

function ActionButton({ label, tone, iconXml, onPress }: { label: string; tone: 'outline' | 'tonal'; iconXml: string; onPress: () => void }) {
  const D = useDetailColors();
  const C = useHomeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => ({
        flex: 1,
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        borderWidth: tone === 'outline' ? 1 : 0,
        borderColor: C.green,
        backgroundColor: tone === 'tonal' ? D.tonalButton : 'transparent',
        opacity: pressed ? 0.85 : 1,
      })}>
      <SvgXml xml={iconXml} width={18} height={18} />
      <AppText style={{ color: C.greenInk, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 20 }}>{label}</AppText>
    </Pressable>
  );
}

function MetaRow({ iconXml, size, text }: { iconXml: string; size: number; text: string }) {
  const D = useDetailColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
        <SvgXml xml={iconXml} width={size} height={size} />
      </View>
      <AppText variant="caption" style={{ flexShrink: 1, color: D.metaInk, fontSize: 12, lineHeight: 18 }}>
        {text}
      </AppText>
    </View>
  );
}

interface StopProps {
  kind: 'pickup' | 'drop';
  party: OrderParty;
  window: string;
  /** Pickup stops only: a status pill under the address, such as "Ready for pickup". */
  badge?: string;
  /** Hide Call and Navigate (the kitchen once the order is collected). */
  hideActions?: boolean;
}

function Stop({ kind, party, window, badge, hideActions = false }: StopProps) {
  const D = useDetailColors();
  const C = useHomeColors();
  const pickup = kind === 'pickup';
  const callLabel = pickup ? 'Call kitchen' : 'Call customer';

  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: TILE,
          height: TILE,
          borderRadius: pickup ? 12 : TILE / 2,
          backgroundColor: pickup ? D.nextCard : D.stopDark,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {pickup ? <SvgXml xml={kitchenTileSvg} width={20} height={20} /> : <SvgXml xml={pinTileSvg} width={14.83} height={18.17} />}
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <AppText variant="caption" style={{ color: D.subtle, fontSize: 12, lineHeight: 16 }}>
          {pickup ? 'Pick up from' : 'Deliver to'}
        </AppText>
        <AppText variant="title" style={{ color: C.title, fontFamily: FONT_FAMILY.bold, fontSize: 15, lineHeight: 20.63 }}>
          {party.name}
        </AppText>
        {party.address ? (
          <AppText style={{ color: D.subtle, fontSize: pickup ? 13 : 12, lineHeight: 16, paddingTop: 1 }}>{party.address}</AppText>
        ) : null}
        {pickup && badge ? (
          <View
            accessible
            accessibilityLabel={badge}
            style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: C.completedBg }}>
            <SvgXml xml={readyCheckSvg} width={14} height={14} />
            <AppText variant="caption" style={{ color: C.completedInk, fontFamily: FONT_FAMILY.bold, fontSize: 12, lineHeight: 16 }}>
              {badge}
            </AppText>
          </View>
        ) : null}
        <View style={{ gap: 6, paddingTop: badge && pickup ? 6 : 11 }}>
          {party.landmark ? <MetaRow iconXml={landmarkSvg} size={12.67} text={`Landmark: ${party.landmark}`} /> : null}
          {window ? <MetaRow iconXml={clockSmallSvg} size={14} text={`${pickup ? 'Pickup' : 'Delivery'} time: ${window}`} /> : null}
          {!party.location ? (
            <AppText variant="caption" style={{ color: D.metaInk, fontSize: 12, lineHeight: 18 }}>
              Map location is missing for this address.
            </AppText>
          ) : null}
        </View>
        {!hideActions && (party.phone || party.location) ? (
          <View style={{ flexDirection: 'row', gap: 12, paddingTop: 16 }}>
            {party.phone ? (
              <ActionButton label={callLabel} tone="outline" iconXml={callSvg} onPress={() => void Linking.openURL(`tel:${party.phone}`)} />
            ) : null}
            {party.location ? (
              <ActionButton
                label="Navigate"
                tone="tonal"
                iconXml={navigateCircleSvg}
                onPress={() => void Linking.openURL(mapsDirectionsUrl(party.location as NonNullable<OrderParty['location']>))}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/**
 * The pickup and drop-off as one timeline, with Call and Navigate on each stop that still needs them. Both stops
 * stay on screen for the whole order; the kitchen loses its buttons once the order is collected.
 */
export function RouteCard({ order }: { order: RiderOrder }) {
  const D = useDetailColors();
  const C = useHomeColors();
  const start = formatClockFromIso(order.slotStart ?? '');
  const end = formatClockFromIso(order.slotEnd ?? '');
  const window = start && end ? `${start} - ${end}` : '';

  const pickupBadge =
    order.lifecycle === 'postPickup' ? 'Picked up' : order.lifecycle === 'prePickup' && isReadyForPickup(order.statusKey) ? 'Ready for pickup' : undefined;

  return (
    <View style={{ padding: 17, gap: 24, borderRadius: HOME_METRICS.radius, borderWidth: 1, borderColor: C.border, backgroundColor: C.card }}>
      <DashedLine vertical color={D.pending} style={{ position: 'absolute', left: 36, top: 57, bottom: 57 }} />
      <Stop kind="pickup" party={order.kitchen} window={window} badge={pickupBadge} hideActions={order.lifecycle === 'postPickup'} />
      <Stop kind="drop" party={order.customer} window={window} />
    </View>
  );
}
