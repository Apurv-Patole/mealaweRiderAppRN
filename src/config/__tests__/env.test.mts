import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildEnv, resolveEnvName } from '../env.ts';
import { environments } from '../environments.ts';

describe('resolveEnvName', () => {
  it('accepts the three known environments', () => {
    assert.equal(resolveEnvName('local'), 'local');
    assert.equal(resolveEnvName('staging'), 'staging');
    assert.equal(resolveEnvName('production'), 'production');
  });

  it('defaults to production for anything else', () => {
    assert.equal(resolveEnvName(undefined), 'production');
    assert.equal(resolveEnvName(''), 'production');
    assert.equal(resolveEnvName('prod'), 'production');
  });
});

describe('buildEnv', () => {
  it('uses the environment server URL', () => {
    assert.equal(buildEnv('production', undefined).serverUrl, 'https://api.mealawe.com');
    // The local URL is each developer's own machine/LAN address, so compare to the config, not a literal.
    assert.equal(buildEnv('local', undefined).serverUrl, environments.local.serverUrl);
  });

  it('lets EXPO_PUBLIC_API_URL override the URL and trims trailing slashes', () => {
    assert.equal(buildEnv('production', 'http://192.168.1.20:5000//').serverUrl, 'http://192.168.1.20:5000');
  });

  it('ignores a blank override', () => {
    assert.equal(buildEnv('production', '   ').serverUrl, 'https://api.mealawe.com');
  });

  it('uses the proximity gate set in the environment config', () => {
    assert.equal(buildEnv('production', undefined).kitchenProximityMeters, environments.production.kitchenProximityMeters);
  });
});
