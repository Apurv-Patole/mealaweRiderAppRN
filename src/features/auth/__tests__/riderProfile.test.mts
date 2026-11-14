import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizeRiderProfile } from '../riderProfile.ts';

describe('normalizeRiderProfile', () => {
  it('maps the current server field names', () => {
    const profile = normalizeRiderProfile({
      _id: 'r1',
      name: 'Asha',
      phoneNo: '9876543210',
      routeNo: 7,
      clusters: [{ clusterId: 'c1', clusterName: 'Baner' }],
      isActive: true,
    });
    assert.deepEqual(profile, {
      riderId: 'r1',
      phoneNo: '9876543210',
      name: 'Asha',
      routeNo: '7',
      clusters: [{ clusterId: 'c1', clusterName: 'Baner', allowed: true }],
      isActive: true,
    });
  });

  it('accepts the older delivery_route_no and cluster_allowed names', () => {
    const profile = normalizeRiderProfile({
      _id: 'r2',
      delivery_route_no: 'A3',
      cluster_allowed: [{ clusterName: 'Wakad' }],
    });
    assert.equal(profile?.routeNo, 'A3');
    assert.deepEqual(profile?.clusters, [{ clusterId: undefined, clusterName: 'Wakad', allowed: true }]);
  });

  it('treats a missing route as null and a missing isActive as active', () => {
    const profile = normalizeRiderProfile({ _id: 'r3' });
    assert.equal(profile?.routeNo, null);
    assert.equal(profile?.isActive, true);
    assert.deepEqual(profile?.clusters, []);
  });

  it('marks a rider inactive only when isActive is explicitly false', () => {
    assert.equal(normalizeRiderProfile({ _id: 'r4', isActive: false })?.isActive, false);
  });

  it('falls back to the login phone number', () => {
    assert.equal(normalizeRiderProfile({ _id: 'r5' }, '9000000000')?.phoneNo, '9000000000');
  });

  it('ignores malformed cluster entries', () => {
    const profile = normalizeRiderProfile({ _id: 'r6', clusters: [null, 'x', { clusterName: 'Aundh' }] });
    assert.equal(profile?.clusters.length, 1);
  });

  it('returns null for non-objects and payloads without an id', () => {
    assert.equal(normalizeRiderProfile(null), null);
    assert.equal(normalizeRiderProfile('x'), null);
    assert.equal(normalizeRiderProfile({}), null);
  });
});
