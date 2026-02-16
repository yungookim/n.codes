const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateConfig, mergeConfig, DEFAULTS } = require('../src/config');

describe('config', () => {
  describe('validateConfig', () => {
    it('accepts a valid config object', () => {
      assert.doesNotThrow(() => validateConfig({ user: { id: '1' } }));
    });

    it('accepts empty config object', () => {
      assert.doesNotThrow(() => validateConfig({}));
    });

    it('throws on null', () => {
      assert.throws(() => validateConfig(null), /requires a config object/);
    });

    it('throws on non-object', () => {
      assert.throws(() => validateConfig('bad'), /requires a config object/);
    });

    it('throws on unsupported mode', () => {
      assert.throws(() => validateConfig({ mode: 'simulation' }), /Simulation mode is no longer supported/);
    });

    it('accepts live mode (optional)', () => {
      assert.doesNotThrow(() => validateConfig({ mode: 'live' }));
    });

    it('throws on invalid theme', () => {
      assert.throws(() => validateConfig({ theme: 'neon' }), /Invalid theme/);
    });

    it('accepts valid themes', () => {
      assert.doesNotThrow(() => validateConfig({ theme: 'dark' }));
      assert.doesNotThrow(() => validateConfig({ theme: 'light' }));
      assert.doesNotThrow(() => validateConfig({ theme: 'auto' }));
    });

    it('throws on invalid position', () => {
      assert.throws(() => validateConfig({ position: 'top-center' }), /Invalid position/);
    });

    it('accepts valid positions', () => {
      assert.doesNotThrow(() => validateConfig({ position: 'bottom-center' }));
      assert.doesNotThrow(() => validateConfig({ position: 'bottom-right' }));
      assert.doesNotThrow(() => validateConfig({ position: 'bottom-left' }));
    });
  });

  describe('mergeConfig', () => {
    it('applies defaults for missing fields', () => {
      const result = mergeConfig({});
      assert.equal(result.theme, DEFAULTS.theme);
      assert.equal(result.position, DEFAULTS.position);
      assert.equal(result.triggerLabel, DEFAULTS.triggerLabel);
      assert.equal(result.user, null);
      assert.deepEqual(result.quickPrompts, []);
    });

    it('preserves user-provided values', () => {
      const result = mergeConfig({
        user: { id: '42', name: 'Test' },
        theme: 'light',
        triggerLabel: 'AI Builder',
      });
      assert.deepEqual(result.user, { id: '42', name: 'Test' });
      assert.equal(result.theme, 'light');
      assert.equal(result.triggerLabel, 'AI Builder');
      assert.equal(result.mode, 'live');
    });

    it('throws for invalid config', () => {
      assert.throws(() => mergeConfig(null), /requires a config object/);
    });
  });

  describe('DEFAULTS', () => {
    it('has expected keys', () => {
      assert.ok('user' in DEFAULTS);
      assert.ok('apiUrl' in DEFAULTS);
      assert.ok('provider' in DEFAULTS);
      assert.ok('model' in DEFAULTS);
      assert.ok('theme' in DEFAULTS);
      assert.ok('position' in DEFAULTS);
      assert.ok('triggerLabel' in DEFAULTS);
      assert.ok('panelTitle' in DEFAULTS);
      assert.ok('panelIntro' in DEFAULTS);
      assert.ok('quickPrompts' in DEFAULTS);
    });

    it('has sensible default values', () => {
      assert.equal(DEFAULTS.user, null);
      assert.equal(DEFAULTS.mode, 'live');
      assert.equal(DEFAULTS.theme, 'dark');
      assert.equal(DEFAULTS.apiUrl, '/api/generate');
      assert.equal(DEFAULTS.provider, 'openai');
      assert.equal(DEFAULTS.model, 'gpt-5-mini');
    });
  });
});
