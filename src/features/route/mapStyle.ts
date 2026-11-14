/** Google Maps night style (standard dark palette), applied on Android when the phone is in dark mode. */
interface MapStyleRule {
  elementType?: string;
  featureType?: string;
  stylers: Record<string, string>[];
}

export const DARK_MAP_STYLE: MapStyleRule[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d2433' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9aa4b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d2433' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#3a4358' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#8590a6' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1f3a2e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c3548' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1d2433' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#aab3c5' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3b4a68' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2a3245' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1a2e' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#5b6b8a' }] },
];
