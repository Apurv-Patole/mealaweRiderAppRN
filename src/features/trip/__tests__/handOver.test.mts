import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { canConfirmDelivery, HANDOVER_OPTIONS, isHandOverOption } from '../handOver.ts';

describe('hand over options', () => {
  it('offers the four options from the Ionic app, in order', () => {
    assert.deepEqual([...HANDOVER_OPTIONS], ['Customer HandOver', 'Doorstep', 'Security/Guard', 'Customer Not Reachable']);
  });

  it('recognises only the offered options', () => {
    assert.equal(isHandOverOption('Doorstep'), true);
    assert.equal(isHandOverOption('doorstep'), false);
    assert.equal(isHandOverOption(''), false);
    assert.equal(isHandOverOption('Neighbour'), false);
  });

  it('allows confirming delivery only once an option is chosen', () => {
    assert.equal(canConfirmDelivery(''), false);
    assert.equal(canConfirmDelivery('Security/Guard'), true);
  });
});
