import { Bike } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Easing, View } from 'react-native';
import { AnimatedRegion, MarkerAnimated } from 'react-native-maps';

import { haversineMeters, type LatLng } from '@/lib/geo';
import { useHomeColors } from '@/features/orders/home/useHomeColors';


/** A new fix further than this from the last one is a jump (first fix, GPS regained): the marker snaps instead of gliding. */
const SNAP_DISTANCE_M = 400;
/** Fixes closer than this are GPS jitter and do not turn the bike around. */
const TURN_MIN_M = 3;
/** The glide lasts about one GPS interval so the bike keeps rolling between fixes. */
const GLIDE_MS = 1_000;
/** The marker's picture is captured once, and again briefly after the bike turns. */
const REDRAW_MS = 400;
const SIZE = 40;
const CORE = 26;
const LIME = '#b8f52b';

interface RiderMarkerProps {
  location: LatLng;
}

/**
 * The rider as a bike on the map. It glides to each new position instead of jumping, and faces the way it
 * is travelling (the bike is drawn facing east and mirrored when heading west).
 */
export function RiderMarker({ location }: RiderMarkerProps) {
  const home = useHomeColors();
  const [region] = useState(
    () => new AnimatedRegion({ latitude: location.lat, longitude: location.lng, latitudeDelta: 0, longitudeDelta: 0 }),
  );
  const previous = useRef<LatLng>(location);
  const facingRef = useRef(false);
  const [facingWest, setFacingWest] = useState(false);
  const [redraw, setRedraw] = useState(true);

  useEffect(() => {
    const last = previous.current;
    const moved = haversineMeters(last, location);
    previous.current = location;
    if (moved === 0) return;

    if (moved > TURN_MIN_M && (location.lng < last.lng) !== facingRef.current) {
      facingRef.current = location.lng < last.lng;
      setFacingWest(facingRef.current);
      setRedraw(true);
    }
    const target = { latitude: location.lat, longitude: location.lng, latitudeDelta: 0, longitudeDelta: 0 };
    if (moved > SNAP_DISTANCE_M) {
      region.setValue(target);
      return;
    }
    const config = { ...target, toValue: 0, duration: GLIDE_MS, easing: Easing.linear, useNativeDriver: false };
    region.timing(config as unknown as Parameters<typeof region.timing>[0]).start();
  }, [location, region]);

  // Native markers are bitmaps: draw again for a moment whenever the picture changes.
  useEffect(() => {
    if (!redraw) return;
    const timer = setTimeout(() => setRedraw(false), REDRAW_MS);
    return () => clearTimeout(timer);
  }, [redraw]);

  return (
    <MarkerAnimated
      coordinate={region as never}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      zIndex={10}
      title="You"
      tracksViewChanges={redraw}>
      <View
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: LIME,
          borderWidth: 2,
          borderColor: '#ffffff',
        }}>
        <View
          style={{
            width: CORE,
            height: CORE,
            borderRadius: CORE / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: home.green,
          }}>
          <View style={{ transform: [{ scaleX: facingWest ? -1 : 1 }] }}>
            <Bike size={16} color="#ffffff" />
          </View>
        </View>
      </View>
    </MarkerAnimated>
  );
}
