import { useRouter } from 'expo-router';
import { Navigation } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Linking, Pressable, View } from 'react-native';

import { SvgXml } from '@/components/ThemedSvg';
import { AppText } from '@/components/ui';
import { env } from '@/config';
import { isReadyForPickup } from '@/features/orders/lifecycle';
import { useHomeColors } from '@/features/orders/home/useHomeColors';
import { useShiftColors } from '@/features/shift/useShiftColors';
import { pinSmallSvg, infoBlueSvg } from '@/features/shift/ui/shiftSvgSources';
import { formatDistance, haversineMeters, mapsDirectionsUrl, type LatLng } from '@/lib/geo';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';

import type { LegRoute } from '../directionsApi';
import type { RouteStage, RouteStop } from '../routePlanner';
import { checkHereSvg, sendSvg, tileScooterSvg, timeSvg } from '../ui/routeSvgSources';
import { formatTravelTime } from './travelTime';

interface NextUpCardProps {
  stop: RouteStop;
  stage: RouteStage;
  riderLocation: LatLng | null;
  route: LegRoute | null;
  routeLoading: boolean;
  queuedOrderIds: ReadonlySet<string>;
  pickupBusy: boolean;
  rideBusy: boolean;
  /** Whether the delivery ride has started, which is when delivering is allowed. */
  canDeliver: boolean;
  onPickup: (stop: RouteStop) => void;
  onStartRide: () => void;
}

/** A pill with an icon: white with a hairline (distance, road time), or green ("You are here"). */
function Badge({ label, iconXml, rotate, tone = 'plain' }: { label: string; iconXml: string; rotate?: string; tone?: 'plain' | 'here' | 'saved' }) {
  const home = useHomeColors();
  const shift = useShiftColors();
  const look =
    tone === 'here'
      ? { bg: shift.hereBg, ink: shift.hereInk, border: 'transparent', family: FONT_FAMILY.semibold }
      : tone === 'saved'
        ? { bg: shift.alertBg, ink: shift.alertInk, border: 'transparent', family: FONT_FAMILY.semibold }
        : { bg: home.card, ink: shift.badgeInk, border: shift.badgeBorder, family: FONT_FAMILY.semibold };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: tone === 'plain' ? 6 : 4, paddingHorizontal: tone === 'plain' ? 11 : 10, paddingVertical: tone === 'plain' ? 5 : 4, borderRadius: 999, borderWidth: 1, borderColor: look.border, backgroundColor: look.bg }}>
      <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center', transform: rotate ? [{ rotate }] : undefined }}>
        <SvgXml xml={iconXml} width={14} height={14} />
      </View>
      <AppText variant="caption" style={{ color: look.ink, fontFamily: look.family, fontSize: 12, lineHeight: 16 }}>
        {label}
      </AppText>
    </View>
  );
}

function ActionButton({
  label,
  busy = false,
  disabled = false,
  outlined = false,
  icon,
  onPress,
}: {
  label: string;
  busy?: boolean;
  disabled?: boolean;
  outlined?: boolean;
  icon?: ReactNode;
  onPress: () => void;
}) {
  const home = useHomeColors();
  const blocked = busy || disabled;
  const textColor = outlined ? home.greenInk : home.onGreen;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked, busy }}
      disabled={blocked}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: outlined ? 1 : 0,
        borderColor: home.greenInk,
        backgroundColor: outlined ? 'transparent' : home.green,
        opacity: blocked ? 0.5 : pressed ? 0.88 : 1,
      })}>
      {busy ? <ActivityIndicator color={textColor} /> : icon}
      <AppText style={{ color: textColor, fontFamily: FONT_FAMILY.bold, fontSize: 14.5, lineHeight: 21.75 }}>{label}</AppText>
    </Pressable>
  );
}

/**
 * The one thing to do right now: where to go, how far, and its single main button (Start pickup, Start ride,
 * or Deliver). Everything else on the Route tab is information; this card is the action.
 */
export function NextUpCard({
  stop,
  stage,
  riderLocation,
  route,
  routeLoading,
  queuedOrderIds,
  pickupBusy,
  rideBusy,
  canDeliver,
  onPickup,
  onStartRide,
}: NextUpCardProps) {
  const router = useRouter();
  const home = useHomeColors();
  const shift = useShiftColors();
  const isKitchen = stop.type === 'kitchen';

  const meters = riderLocation
    ? haversineMeters(riderLocation, stop.location)
    : stop.distanceFromRiderKm !== null
      ? stop.distanceFromRiderKm * 1000
      : null;
  const nearKitchen = isKitchen && meters !== null && meters <= env.kitchenProximityMeters;

  const readyOrders = stop.orders.filter((order) => isReadyForPickup(order.statusKey) && !queuedOrderIds.has(order.id));
  const savedCount = stop.orders.filter((order) => queuedOrderIds.has(order.id)).length;
  const customerOrder = isKitchen ? undefined : stop.orders[0];
  const deliverable = customerOrder?.lifecycle === 'postPickup' && !queuedOrderIds.has(customerOrder.id);

  const eyebrow = stage === 'ready' ? 'Ready to ride' : isKitchen ? 'Next • Pickup' : 'Next • Deliver';

  let action: ReactNode = null;
  let hint: string | null = null;
  if (stage === 'ready') {
    action = <ActionButton label="Start delivery ride" busy={rideBusy} onPress={onStartRide} />;
    hint = 'Everything is picked up. Start the ride so customers see their order on the way.';
  } else if (isKitchen) {
    if (readyOrders.length > 0) {
      action = (
        <ActionButton
          label={readyOrders.length === 1 ? 'Start pickup' : `Start pickup (${readyOrders.length} orders)`}
          busy={pickupBusy}
          disabled={!nearKitchen}
          onPress={() => onPickup(stop)}
        />
      );
      hint = nearKitchen ? null : `Get within ${env.kitchenProximityMeters} m of the kitchen to start pickup.`;
    } else if (savedCount === 0) {
      hint = 'Waiting for the kitchen to mark the order ready.';
    }
  } else if (customerOrder) {
    if (queuedOrderIds.has(customerOrder.id)) {
      hint = 'Delivery saved. It will send when you have a connection.';
    } else if (deliverable && canDeliver) {
      action = <ActionButton label="Deliver" onPress={() => router.push({ pathname: '/deliver/[id]', params: { id: customerOrder.id } })} />;
    } else {
      hint = customerOrder.lifecycle === 'prePickup' ? 'Pick this order up first.' : 'Start the delivery ride to deliver.';
    }
  }

  return (
    <View style={{ padding: 16, gap: 16, borderRadius: 16, borderWidth: 1, borderColor: home.border, backgroundColor: home.card }}>
      <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: home.border }}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: shift.nextTile, alignItems: 'center', justifyContent: 'center' }}>
          <SvgXml xml={tileScooterSvg} width={20} height={20} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" style={{ color: home.muted, fontSize: 11, lineHeight: 16 }}>
            {eyebrow}
          </AppText>
          <AppText variant="title" numberOfLines={1} style={{ color: home.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 16, lineHeight: 24 }}>
            {stop.name}
          </AppText>
          {stop.subtitle ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}>
              <SvgXml xml={pinSmallSvg} width={14} height={14} />
              <AppText variant="caption" numberOfLines={2} style={{ flex: 1, color: home.muted, fontSize: 11, lineHeight: 16 }}>
                {stop.subtitle}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {meters !== null ? <Badge label={`${formatDistance(meters)} away`} iconXml={sendSvg} rotate="-90deg" /> : null}
        {route ? (
          <Badge label={`About ${formatTravelTime(route.durationSeconds)} by road`} iconXml={timeSvg} />
        ) : routeLoading ? (
          <Badge label="Finding the road…" iconXml={timeSvg} />
        ) : null}
        {nearKitchen ? <Badge label="You are here" iconXml={checkHereSvg} tone="here" /> : null}
        {savedCount > 0 ? <Badge label={`${savedCount} saved, sending`} iconXml={timeSvg} tone="saved" /> : null}
      </View>

      <View style={{ gap: 8 }}>
        <AppText variant="caption" style={{ color: shift.label, fontFamily: FONT_FAMILY.medium, fontSize: 12, lineHeight: 18 }}>
          Orders at this stop
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {stop.orders.map((order) => (
            <Pressable
              key={order.id}
              accessibilityRole="button"
              accessibilityLabel={`Open order ${order.orderNo}`}
              onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
              style={{ minHeight: 36, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: shift.chipBg }}>
              <AppText variant="caption" style={{ color: shift.chipInk, fontFamily: FONT_FAMILY.medium, fontSize: 12, lineHeight: 16, textDecorationLine: 'underline' }}>
                Order #{order.orderNo}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {hint ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: shift.noteBorder, backgroundColor: shift.noteBg }}>
          <View style={{ paddingTop: 2 }}>
            <SvgXml xml={infoBlueSvg} width={16} height={16} />
          </View>
          <AppText style={{ flex: 1, color: shift.noteInk, fontSize: 12.5, lineHeight: 20.31 }}>{hint}</AppText>
        </View>
      ) : null}

      {action}
      <ActionButton
        label="Navigate in Google Maps"
        outlined={action !== null}
        icon={<Navigation size={20} color={action !== null ? home.greenInk : home.onGreen} />}
        onPress={() => void Linking.openURL(mapsDirectionsUrl(stop.location))}
      />
    </View>
  );
}
