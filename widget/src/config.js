/**
 * Configuration validation and defaults for the n.codes widget.
 */

const DEFAULTS = {
  user: null,
  apiUrl: '/api/generate',
  provider: 'openai',
  model: 'gpt-5-mini',
  mode: 'live',
  theme: 'dark',
  position: 'bottom-center',
  triggerLabel: 'Build with AI',
  panelTitle: 'n.codes',
  panelIntro: 'Describe the UI you need and it will be generated instantly.',
  quickPrompts: [],
};

const VALID_THEMES = new Set(['dark', 'light', 'auto']);
const VALID_POSITIONS = new Set(['bottom-center', 'bottom-right', 'bottom-left']);

function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('NCodes.init() requires a config object.');
  }
  if (config.mode && config.mode !== 'live') {
    throw new Error('Simulation mode is no longer supported. Remove mode or set it to "live".');
  }
  if (config.theme && !VALID_THEMES.has(config.theme)) {
    throw new Error(`Invalid theme "${config.theme}". Use: ${Array.from(VALID_THEMES).join(', ')}`);
  }
  if (config.position && !VALID_POSITIONS.has(config.position)) {
    throw new Error(`Invalid position "${config.position}". Use: ${Array.from(VALID_POSITIONS).join(', ')}`);
  }
  return true;
}

function mergeConfig(userConfig) {
  validateConfig(userConfig);
  return { ...DEFAULTS, ...userConfig };
}

module.exports = { DEFAULTS, validateConfig, mergeConfig };
