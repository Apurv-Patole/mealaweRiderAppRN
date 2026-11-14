import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { usePushEventStore } from '../pushEventStore.ts';

describe('usePushEventStore', () => {
  beforeEach(() => usePushEventStore.setState({ id: 0, last: null }));

  it('starts empty', () => {
    assert.equal(usePushEventStore.getState().last, null);
    assert.equal(usePushEventStore.getState().id, 0);
  });

  it('keeps the latest event and bumps the id on every publish', () => {
    usePushEventStore.getState().publish({ type: 'ORDER_READY' });
    assert.deepEqual(usePushEventStore.getState().last, { type: 'ORDER_READY' });
    assert.equal(usePushEventStore.getState().id, 1);

    usePushEventStore.getState().publish({ type: 'ORDER_READY' });
    assert.equal(usePushEventStore.getState().id, 2);
  });
});

describe('usePushEventStore source', () => {
  it('records whether the event came from a notification tap', () => {
    usePushEventStore.getState().publish({ type: 'ORDER_READY' }, 'opened');
    assert.equal(usePushEventStore.getState().source, 'opened');
    usePushEventStore.getState().publish({ type: 'ORDER_READY' });
    assert.equal(usePushEventStore.getState().source, 'foreground');
  });
});
