import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type LatLng as MapLatLng } from 'react-native-maps';

import { SvgXml } from '@/components/ThemedSvg';
import { AppText } from '@/components/ui';
import { useHomeColors } from '@/features/orders/home/useHomeColors';
import { useShiftColors } from '@/features/shift/useShiftColors';
import type { LatLng } from '@/lib/geo';
import { FONT_FAMILY, useScheme } from '@/theme';

import { DARK_MAP_STYLE } from '../mapStyle';
import type { RouteStop } from '../routePlanner';
import { recenterSvg, trafficSvg } from '../ui/routeSvgSources';
import { RiderMarker } from './RiderMarker';

interface RouteMapProps {
  stops: readonly RouteStop[];
  riderLocation: LatLng | null;
  /** The road to the next stop, drawn as a line. */
  route?: readonly LatLng[];
  height?: number;
  /**
   * `preview` is a read-only glance (no Traffic or re-centre buttons, plain destination dot).
   * `full` is the Route tab's interactive map.
   */
  variant?: 'full' | 'preview';
}

const EDGE_PADDING = { top: 60, right: 60, bottom: 60, left: 60 };
/** Native markers are bitmaps: draw them again for a moment after they mount, then stop. */
const REDRAW_MS = 800;

function toMapPoint(point: LatLng): MapLatLng {
  return { latitude: point.lat, longitude: point.lng };
}

/** True when a Google Maps key was provided at build time (see app.config.js). */
function hasMapsKey(): boolean {
  const config = Constants.expoConfig;
  return !!(config?.android?.config?.googleMaps?.apiKey ?? config?.ios?.config?.googleMapsApiKey);
}

const KITCHEN_MARKER = '#075c40';
const CUSTOMER_MARKER = '#1a1e24';

/** A numbered stop on the map: a dark-green rounded square for a pickup, a near-black circle for a delivery. */
function StopMarker({ stop, index, plain = false }: { stop: RouteStop; index: number; plain?: boolean }) {
  const [redraw, setRedraw] = useState(true);
  const kitchen = stop.type === 'kitchen';
  const size = kitchen ? 28 : 24;

  useEffect(() => {
    const timer = setTimeout(() => setRedraw(false), REDRAW_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={toMapPoint(stop.location)}
      title={`${index + 1}. ${stop.name}`}
      description={kitchen ? 'Pickup' : 'Delivery'}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={redraw}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: kitchen ? 8 : size / 2,
          borderWidth: 1,
          borderColor: kitchen ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.8)',
          backgroundColor: kitchen ? KITCHEN_MARKER : CUSTOMER_MARKER,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {plain ? (
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffffff' }} />
        ) : (
          <Text allowFontScaling={false} style={{ width: size, color: '#ffffff', fontFamily: FONT_FAMILY.bold, fontSize: 12, lineHeight: 14, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' }}>{index + 1}</Text>
        )}
      </View>
    </Marker>
  );
}

/** A white floating button on the map (Traffic, re-centre). */
function MapButton({
  label,
  selected,
  onPress,
  children,
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
  style: object;
}) {
  const shift = useShiftColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: shift.mapChrome,
        borderWidth: 1,
        borderColor: shift.badgeBorder,
        shadowColor: '#000000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        ...style,
      }}>
      {children}
    </Pressable>
  );
}

/**
 * The route on a map: kitchens as dark-green squares, customers as black pins, the rider as a bike that glides
 * along. The view fits itself once per set of stops (not on every GPS update, which would fight the rider's pan).
 */
export function RouteMap({ stops, riderLocation, route, height = 280, variant = 'full' }: RouteMapProps) {
  const preview = variant === 'preview';
  const home = useHomeColors();
  const shift = useShiftColors();
  const [showTraffic, setShowTraffic] = useState(true);
  const [following, setFollowing] = useState(false);
  const scheme = useScheme();
  const mapRef = useRef<MapView>(null);
  const fittedKey = useRef('');
  const stopKey = stops.map((stop) => stop.id).join('|');

  useEffect(() => {
    if (stops.length === 0 || fittedKey.current === stopKey) return;
    fittedKey.current = stopKey;
    const points = [...stops.map((stop) => stop.location), ...(riderLocation ? [riderLocation] : [])].map(toMapPoint);
    mapRef.current?.fitToCoordinates(points, { edgePadding: EDGE_PADDING, animated: true });
  }, [stopKey, stops, riderLocation]);

  // While following, the camera keeps the bike in view as it moves.
  useEffect(() => {
    if (!following || !riderLocation) return;
    mapRef.current?.animateCamera({ center: toMapPoint(riderLocation), zoom: 16 }, { duration: 900 });
  }, [following, riderLocation]);

  if (!hasMapsKey()) {
    return (
      <View style={{ gap: 4, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: home.border, backgroundColor: home.card }}>
        <AppText style={{ color: home.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 14, lineHeight: 20 }}>Map unavailable</AppText>
        <AppText style={{ color: home.muted, fontSize: 13, lineHeight: 19 }}>
          This build has no Google Maps key, so the map is hidden. The stop list below still works. Set
          GOOGLE_MAPS_API_KEY when building.
        </AppText>
      </View>
    );
  }

  const isDark = scheme === 'dark';
  const first = stops[0]?.location ?? riderLocation;

  return (
    <View
      style={{ height, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', overflow: 'hidden' }}
      accessibilityLabel="Route map">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        showsUserLocation={!riderLocation}
        onPanDrag={() => setFollowing(false)}
        showsTraffic={showTraffic && !preview}
        scrollEnabled={!preview}
        zoomEnabled={!preview}
        rotateEnabled={!preview}
        pitchEnabled={!preview}
        userInterfaceStyle={scheme}
        customMapStyle={isDark ? DARK_MAP_STYLE : undefined}
        initialRegion={
          first ? { latitude: first.lat, longitude: first.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 } : undefined
        }>
        {route && route.length > 1 ? (
          <>
            <Polyline coordinates={route.map(toMapPoint)} strokeColor="#ffffff" strokeWidth={9} zIndex={1} />
            <Polyline coordinates={route.map(toMapPoint)} strokeColor={home.green} strokeWidth={5} zIndex={2} />
          </>
        ) : null}
        {stops.map((stop, index) => (
          <StopMarker key={stop.id} stop={stop} index={index} plain={preview} />
        ))}
        {riderLocation ? <RiderMarker location={riderLocation} /> : null}
      </MapView>

      {preview ? null : (
      <MapButton
        label={showTraffic ? 'Hide traffic on the map' : 'Show traffic on the map'}
        selected={showTraffic}
        onPress={() => setShowTraffic((current) => !current)}
        style={{ left: 16, bottom: 16, height: 36, paddingHorizontal: 14, borderRadius: 999, gap: 6 }}>
        <SvgXml xml={trafficSvg} width={14} height={14} />
        <AppText variant="caption" style={{ color: shift.badgeInk, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
          Traffic
        </AppText>
      </MapButton>
      )}

      {riderLocation && !preview ? (
        <MapButton
          label={following ? 'Stop following my location' : 'Follow my location'}
          selected={following}
          onPress={() => setFollowing((current) => !current)}
          style={{
            right: 16,
            bottom: 16,
            width: 40,
            height: 40,
            borderRadius: 12,
            borderColor: following ? home.greenInk : shift.badgeBorder,
          }}>
          <SvgXml xml={recenterSvg} width={20} height={20} />
        </MapButton>
      ) : null}
    </View>
  );
}
