import { View } from 'react-native';

import { SvgXml } from '@/components/ThemedSvg';
import { AppText } from '@/components/ui';
import { RouteMap } from '@/features/route/components/RouteMap';
import { formatTravelTime } from '@/features/route/components/travelTime';
import type { RouteStop } from '@/features/route/routePlanner';
import { useLegRoute } from '@/features/route/useLegRoute';
import { useShiftColors } from '@/features/shift/useShiftColors';
import { formatDistance, type LatLng } from '@/lib/geo';
import { FONT_FAMILY } from '@/theme';

import { clockRouteSvg } from '../home/detailSvgSources';
import { useDetailColors, useHomeColors } from '../home/useHomeColors';
import type { RiderOrder } from '../orderModel';

const HEIGHT = 180;

/** A read-only map from the rider to the customer, with a floating "About 8 min · 2.5 km" pill. Null with no map point. */
export function RoutePreviewCard({ order, riderLocation }: { order: RiderOrder; riderLocation: LatLng | null }) {
  const home = useHomeColors();
  const detail = useDetailColors();
  const shift = useShiftColors();
  const destination = order.customer.location;
  const leg = useLegRoute(riderLocation, destination, destination !== null);

  if (!destination) return null;

  const stop: RouteStop = {
    id: `customer-${order.id}`,
    type: 'customer',
    location: destination,
    name: order.customer.name,
    subtitle: order.customer.address,
    orders: [order],
    distanceFromPrevKm: null,
    distanceFromRiderKm: null,
  };

  return (
    <View style={{ height: HEIGHT, borderRadius: 16, borderWidth: 1, borderColor: detail.mapBorder, backgroundColor: home.card, overflow: 'hidden' }}>
      <RouteMap variant="preview" stops={[stop]} riderLocation={riderLocation} route={leg.route?.points} height={HEIGHT} />
      {leg.route ? (
        <View
          accessible
          accessibilityLabel={`About ${formatTravelTime(leg.route.durationSeconds)}, ${formatDistance(leg.route.distanceMeters)}`}
          style={{
            position: 'absolute',
            left: 12,
            top: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 13,
            paddingVertical: 7,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: shift.badgeBorder,
            backgroundColor: shift.mapChrome,
          }}>
          <SvgXml xml={clockRouteSvg} width={14} height={14} />
          <AppText variant="caption" style={{ color: home.title, fontFamily: FONT_FAMILY.bold, fontSize: 12, lineHeight: 12 }}>
            About {formatTravelTime(leg.route.durationSeconds)}
          </AppText>
          <AppText variant="caption" style={{ color: detail.subtle, fontFamily: FONT_FAMILY.medium, fontSize: 12, lineHeight: 12 }}>
            · {formatDistance(leg.route.distanceMeters)}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
