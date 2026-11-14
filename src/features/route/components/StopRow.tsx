import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { SvgXml } from '@/components/ThemedSvg';
import { AppText } from '@/components/ui';
import { dropoffSvg, pickupSvg } from '@/features/orders/home/orderSvgSources';
import { useHomeColors } from '@/features/orders/home/useHomeColors';
import { useShiftColors } from '@/features/shift/useShiftColors';
import { formatDistance, haversineMeters, type LatLng } from '@/lib/geo';
import { FONT_FAMILY } from '@/theme';

import type { RouteStop } from '../routePlanner';
import { stopSubtitle } from '../routeText';

interface StopRowProps {
  stop: RouteStop;
  /** 1-based position in the whole route. */
  position: number;
  riderLocation: LatLng | null;
  /** The last row has no divider under it. */
  last: boolean;
}

/** A later stop as one row of the "Then" card: icon tile, "2. Name", and what to do there. Tap to open its order. */
export function StopRow({ stop, position, riderLocation, last }: StopRowProps) {
  const router = useRouter();
  const home = useHomeColors();
  const shift = useShiftColors();
  const first = stop.orders[0];
  const kitchen = stop.type === 'kitchen';
  const meters = riderLocation
    ? haversineMeters(riderLocation, stop.location)
    : stop.distanceFromRiderKm !== null
      ? stop.distanceFromRiderKm * 1000
      : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Stop ${position}, ${stop.name}`}
      disabled={!first}
      onPress={() => first && router.push({ pathname: '/order/[id]', params: { id: first.id } })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: 12,
        paddingBottom: last ? 0 : 8,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: shift.listDivider,
        opacity: pressed ? 0.8 : 1,
      })}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: 36,
          height: 36,
          borderRadius: kitchen ? 12 : 18,
          backgroundColor: kitchen ? home.pickupTile : home.dropoffTile,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {kitchen ? <SvgXml xml={pickupSvg} width={18} height={18} /> : <SvgXml xml={dropoffSvg} width={13.5} height={16.5} />}
      </View>
      <View style={{ flex: 1, paddingTop: 2 }}>
        <AppText numberOfLines={1} style={{ color: home.ink, fontFamily: FONT_FAMILY.bold, fontSize: 14.5, lineHeight: 19.94 }}>
          {position}. {stop.name}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={{ color: home.muted, fontSize: 12, lineHeight: 15, paddingTop: 1 }}>
          {stopSubtitle(stop.type, stop.orders.length, meters !== null ? formatDistance(meters) : null)}
        </AppText>
      </View>
    </Pressable>
  );
}
