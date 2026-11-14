import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { startRoute } from '../startRoute.ts';

describe('startRoute', () => {
  it('opens Orders for a signed-in rider, whatever the first-run flag says', () => {
    assert.equal(startRoute(true, false), '/(tabs)/orders');
    assert.equal(startRoute(true, true), '/(tabs)/orders');
  });

  it('shows onboarding to a new, signed-out rider', () => {
    assert.equal(startRoute(false, false), '/onboarding');
  });

  it('shows login to a returning, signed-out rider', () => {
    assert.equal(startRoute(false, true), '/login');
  });
});
