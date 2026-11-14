import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { formatClockFromIso } from '@/lib/dates';
import { FONT_FAMILY } from '@/theme';

import { DashedLine } from '../home/DashedLine';
import { clockFooterSvg, clockPillSvg, dropoffSvg, pickupSvg } from '../home/orderSvgSources';
import { HOME_METRICS } from '../home/homeTheme';
import { tintSvg } from '../home/svgTint';
import { formatRupees, statusLabel, statusTone, type RiderOrder } from '../orderModel';
import { useHomeColors, useOrderPill } from '@/features/orders/home/useHomeColors';

interface OrderCardProps {
  order: RiderOrder;
}

/** The pill icon is drawn in the design's blue; swap it for the tone's own ink. */
const DESIGN_PILL_INK = '#2b64b1';

function itemSummary(order: RiderOrder): string {
  const count = order.items.reduce((sum, item) => sum + item.count, 0) + order.addOnCount;
  if (count === 0 && order.packageName) return order.packageName;
  return `${count} ${count === 1 ? 'item' : 'items'}`;
}

/** The dashed line between the pickup and drop-off tiles. */
function Connector() {
  const C = useHomeColors();
  return <DashedLine vertical color={C.connector} style={{ position: 'absolute', left: 17, top: 40, bottom: 40 }} />;
}

function StopText({ caption, title, detail }: { caption: string; title: string; detail?: string }) {
  const C = useHomeColors();
  return (
    <View style={{ flex: 1, paddingTop: 2 }}>
      <AppText variant="caption" style={{ color: C.muted, fontSize: 12, lineHeight: 15 }}>
        {caption}
      </AppText>
      <AppText numberOfLines={1} style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 14.5, lineHeight: 19.94, paddingTop: 1 }}>
        {title}
      </AppText>
      {detail ? (
        <AppText variant="caption" numberOfLines={2} style={{ color: C.muted, fontSize: 12.5, lineHeight: 15.63, paddingTop: 1 }}>
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}

/** One order in a list: number and status, a pickup-to-drop-off timeline, and a footer with items, time and amount. */
export function OrderCard({ order }: OrderCardProps) {
  const C = useHomeColors();
  const orderPill = useOrderPill();
  const router = useRouter();
  const tone = statusTone(order);
  const pill = orderPill[tone];
  const start = formatClockFromIso(order.slotStart ?? '');
  const end = formatClockFromIso(order.slotEnd ?? '');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.orderNo}, ${statusLabel(order)}`}
      onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <View
        style={{
          padding: 16,
          borderRadius: HOME_METRICS.radius,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: C.card,
          shadowColor: C.ink,
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 14 }}>
          <AppText variant="title" numberOfLines={1} style={{ flexShrink: 1, color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 16, lineHeight: 24, letterSpacing: -0.4 }}>
            Order #{order.orderNo}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: pill.bg }}>
            <SvgXml xml={tintSvg(clockPillSvg, DESIGN_PILL_INK, pill.ink)} width={14} height={14} />
            <AppText variant="caption" style={{ color: pill.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 18, letterSpacing: -0.3 }}>
              {statusLabel(order)}
            </AppText>
          </View>
        </View>

        <View style={{ gap: 20, paddingVertical: 4 }}>
          <Connector />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{ width: HOME_METRICS.stopTile, height: HOME_METRICS.stopTile, borderRadius: 12, backgroundColor: C.pickupTile, alignItems: 'center', justifyContent: 'center' }}>
              <SvgXml xml={pickupSvg} width={18} height={18} />
            </View>
            <StopText caption="Pick up" title={order.kitchen.name} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{ width: HOME_METRICS.stopTile, height: HOME_METRICS.stopTile, borderRadius: 18, backgroundColor: C.dropoffTile, alignItems: 'center', justifyContent: 'center' }}>
              <SvgXml xml={dropoffSvg} width={13.5} height={16.5} />
            </View>
            <StopText caption="Delivery to" title={order.customer.name} detail={order.customer.address || undefined} />
          </View>
        </View>

        <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <AppText variant="caption" style={{ color: C.muted, fontSize: 13, lineHeight: 19.5 }}>
              {itemSummary(order)}
            </AppText>
            {start && end ? (
              <View style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <SvgXml xml={clockFooterSvg} width={14} height={14} />
                <AppText variant="caption" numberOfLines={1} style={{ flexShrink: 1, color: C.muted, fontSize: 13, lineHeight: 19.5 }}>
                  {start} to {end}
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 17, lineHeight: 25.5, letterSpacing: -0.425 }}>
            {formatRupees(order.totalAmount)}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}
