import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  actionFor,
  INITIAL_STATUSES,
  isActionable,
  isReady,
  missingRequired,
  nextKey,
  PERMISSION_ITEMS,
  statusLabel,
  type PermissionStatuses,
} from '../permissionState.ts';

const ALL_GRANTED: PermissionStatuses = {
  location: 'granted',
  backgroundLocation: 'granted',
  notifications: 'granted',
  camera: 'granted',
  battery: 'unknown',
};

describe('permission items', () => {
  it('lists location, always-location, notifications, camera, then battery', () => {
    assert.deepEqual(
      PERMISSION_ITEMS.map((item) => item.key),
      ['location', 'backgroundLocation', 'notifications', 'camera', 'battery'],
    );
  });

  it('requires everything except battery optimisation', () => {
    assert.deepEqual(
      PERMISSION_ITEMS.filter((item) => item.required).map((item) => item.key),
      ['location', 'backgroundLocation', 'notifications', 'camera'],
    );
  });
});

describe('isReady / missingRequired / nextKey', () => {
  it('is ready when all required permissions are granted, whatever the battery status', () => {
    assert.equal(isReady(ALL_GRANTED), true);
    assert.deepEqual(missingRequired(ALL_GRANTED), []);
    assert.equal(nextKey(ALL_GRANTED), null);
  });

  it('is not ready at first launch and points at foreground location first', () => {
    assert.equal(isReady(INITIAL_STATUSES), false);
    assert.deepEqual(missingRequired(INITIAL_STATUSES), ['location', 'backgroundLocation', 'notifications', 'camera']);
    assert.equal(nextKey(INITIAL_STATUSES), 'location');
  });

  it('treats denied and blocked as missing', () => {
    const statuses = { ...ALL_GRANTED, notifications: 'blocked' as const };
    assert.deepEqual(missingRequired(statuses), ['notifications']);
    assert.equal(nextKey({ ...ALL_GRANTED, backgroundLocation: 'denied' }), 'backgroundLocation');
  });
});

describe('actionFor', () => {
  it('requests when the system prompt can still be shown', () => {
    assert.equal(actionFor('location', 'undetermined'), 'request');
    assert.equal(actionFor('notifications', 'denied'), 'request');
  });

  it('opens Settings when blocked and does nothing when granted', () => {
    assert.equal(actionFor('location', 'blocked'), 'openSettings');
    assert.equal(actionFor('location', 'granted'), 'none');
  });

  it('always sends battery to its own settings screen', () => {
    assert.equal(actionFor('battery', 'unknown'), 'openBatterySettings');
    assert.equal(actionFor('battery', 'granted'), 'openBatterySettings');
  });
});

describe('isActionable', () => {
  it('only allows always-location after foreground location is granted', () => {
    assert.equal(isActionable('backgroundLocation', INITIAL_STATUSES), false);
    assert.equal(isActionable('backgroundLocation', { ...INITIAL_STATUSES, location: 'granted' }), true);
  });

  it('allows the other permissions at any time', () => {
    assert.equal(isActionable('location', INITIAL_STATUSES), true);
    assert.equal(isActionable('notifications', INITIAL_STATUSES), true);
    assert.equal(isActionable('battery', INITIAL_STATUSES), true);
  });
});

describe('statusLabel', () => {
  it('has a short label for every status', () => {
    assert.equal(statusLabel('granted'), 'Allowed');
    assert.equal(statusLabel('blocked'), 'Blocked');
    assert.equal(statusLabel('denied'), 'Not allowed');
    assert.equal(statusLabel('undetermined'), 'Not set');
    assert.equal(statusLabel('unknown'), 'Check');
  });
});
