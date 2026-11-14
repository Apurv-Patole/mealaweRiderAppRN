import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { INITIAL_AUTH_STATE, restoreState, signedIn, signedOut, withRider } from '../authState.ts';
import type { RiderProfile } from '../riderProfile.ts';

const RIDER: RiderProfile = {
  riderId: 'r1',
  phoneNo: '9876543210',
  name: 'Asha',
  routeNo: '7',
  clusters: [],
  isActive: true,
};

describe('authState', () => {
  it('starts in the booting state with no credentials', () => {
    assert.deepEqual(INITIAL_AUTH_STATE, { status: 'booting', token: null, rider: null });
  });

  it('signs in with a token and rider', () => {
    assert.deepEqual(signedIn('tok', RIDER), { status: 'signedIn', token: 'tok', rider: RIDER });
  });

  it('signs out by clearing everything', () => {
    assert.deepEqual(signedOut(), { status: 'signedOut', token: null, rider: null });
  });

  it('restores a signed-in state only when a token exists', () => {
    assert.equal(restoreState('tok', RIDER).status, 'signedIn');
    assert.equal(restoreState('tok', null).status, 'signedIn');
    assert.equal(restoreState(null, RIDER).status, 'signedOut');
    assert.equal(restoreState(null, RIDER).rider, null);
  });

  it('replaces the rider immutably while signed in', () => {
    const before = signedIn('tok', null);
    const after = withRider(before, RIDER);
    assert.equal(after.rider, RIDER);
    assert.equal(before.rider, null);
    assert.notEqual(after, before);
  });

  it('ignores a rider update while signed out', () => {
    const state = signedOut();
    assert.equal(withRider(state, RIDER), state);
  });
});
