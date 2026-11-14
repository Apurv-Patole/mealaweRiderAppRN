import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatDistance, haversineMeters, isValidLatLng, mapsDirectionsUrl, toLatLng } from '../geo.ts';

describe('haversineMeters', () => {
  it('is 0 for the same point', () => {
    assert.equal(haversineMeters({ lat: 18.5204, lng: 73.8567 }, { lat: 18.5204, lng: 73.8567 }), 0);
  });

  it('measures about 111 km per degree of latitude', () => {
    const meters = haversineMeters({ lat: 18, lng: 73 }, { lat: 19, lng: 73 });
    assert.ok(Math.abs(meters - 111_195) < 300, String(meters));
  });

  it('measures a short walk accurately (about 100 m north)', () => {
    const meters = haversineMeters({ lat: 18.5204, lng: 73.8567 }, { lat: 18.5204 + 0.0009, lng: 73.8567 });
    assert.ok(meters > 95 && meters < 105, String(meters));
  });

  it('is symmetric', () => {
    const a = { lat: 18.52, lng: 73.85 };
    const b = { lat: 19.07, lng: 72.87 };
    assert.equal(haversineMeters(a, b), haversineMeters(b, a));
  });
});

describe('isValidLatLng', () => {
  it('accepts points in India', () => {
    assert.equal(isValidLatLng({ lat: 18.52, lng: 73.85 }), true);
  });

  it('rejects null island, out-of-India points, and non-numbers', () => {
    for (const bad of [{ lat: 0, lng: 0 }, { lat: 51.5, lng: -0.12 }, { lat: 18.5, lng: 120 }, { lat: NaN, lng: 73 }, { lat: '18', lng: 73 }, null, undefined, 'x', {}]) {
      assert.equal(isValidLatLng(bad), false, JSON.stringify(bad));
    }
  });
});

describe('toLatLng', () => {
  it('reads lat/lng and latitude/longitude, including numeric strings', () => {
    assert.deepEqual(toLatLng({ lat: 18.52, lng: 73.85 }), { lat: 18.52, lng: 73.85 });
    assert.deepEqual(toLatLng({ latitude: '18.52', longitude: '73.85' }), { lat: 18.52, lng: 73.85 });
  });

  it('returns null for missing or invalid points', () => {
    assert.equal(toLatLng(undefined), null);
    assert.equal(toLatLng({}), null);
    assert.equal(toLatLng({ lat: 0, lng: 0 }), null);
  });
});

describe('formatDistance / mapsDirectionsUrl', () => {
  it('formats metres and kilometres', () => {
    assert.equal(formatDistance(349.6), '350 m');
    assert.equal(formatDistance(999), '999 m');
    assert.equal(formatDistance(1234), '1.2 km');
  });

  it('builds a Google Maps directions link', () => {
    assert.equal(
      mapsDirectionsUrl({ lat: 18.52, lng: 73.85 }),
      'https://www.google.com/maps/dir/?api=1&destination=18.52,73.85&travelmode=driving',
    );
  });
});
