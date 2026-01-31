function defaultCapabilityMap({ generatedAt = new Date().toISOString(), projectName = null } = {}) {
  return {
    version: 1,
    generatedAt,
    projectName,
    entities: {},
    actions: {},
    queries: {},
    components: {},
    meta: {
      filesAnalyzed: 0,
      changedFiles: [],
    },
  };
}

function mergeCapabilityMap(base, updates) {
  return {
    ...base,
    ...updates,
    entities: { ...base.entities, ...updates.entities },
    actions: { ...base.actions, ...updates.actions },
    queries: { ...base.queries, ...updates.queries },
    components: { ...base.components, ...updates.components },
    meta: { ...base.meta, ...updates.meta },
  };
}

function renderCapabilityMapYaml(map) {
  // JSON is valid YAML 1.2; keep it simple for the prototype.
  return JSON.stringify(map, null, 2);
}

function parseCapabilityMapYaml(content) {
  const parsed = JSON.parse(content);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Capability map must be a JSON object.');
  }
  return parsed;
}

function summarizeCapabilityMap(map) {
  return {
    entities: Object.keys(map.entities || {}).length,
    actions: Object.keys(map.actions || {}).length,
    queries: Object.keys(map.queries || {}).length,
    components: Object.keys(map.components || {}).length,
    filesAnalyzed: map.meta?.filesAnalyzed || 0,
  };
}

function validateCapabilityMap(map) {
  const errors = [];
  if (!map || typeof map !== 'object') {
    errors.push('Capability map must be an object.');
    return { valid: false, errors };
  }
  if (!map.version) {
    errors.push('Capability map requires a version.');
  }
  ['entities', 'actions', 'queries', 'components'].forEach((key) => {
    if (!map[key] || typeof map[key] !== 'object') {
      errors.push(`Capability map missing ${key}.`);
    }
  });
  if (!map.generatedAt) {
    errors.push('Capability map missing generatedAt timestamp.');
  }
  return { valid: errors.length === 0, errors };
}

function toCapabilityName(filePath) {
  const segments = filePath.split(/[\\/]/).filter(Boolean);
  const file = segments[segments.length - 1] || '';
  const base = file.replace(/\.[^.]+$/, '');
  return base.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(' ').map((part, index) => {
    if (!part) return '';
    const lower = part.toLowerCase();
    if (index === 0) return lower;
    return lower[0].toUpperCase() + lower.slice(1);
  }).join('');
}

function inferCapabilitiesFromFiles(fileIndex) {
  const map = defaultCapabilityMap();
  const filePaths = Object.keys(fileIndex);
  map.meta.filesAnalyzed = filePaths.length;

  filePaths.forEach((filePath) => {
    const normalized = filePath.replace(/\\/g, '/');
    const name = toCapabilityName(normalized);
    if (!name) return;

    if (normalized.includes('/components/')) {
      map.components[name] = { path: normalized };
      return;
    }
    if (normalized.includes('/api/') || normalized.includes('/routes/')) {
      map.actions[name] = { path: normalized };
      return;
    }
    if (normalized.includes('/queries/') || normalized.includes('/services/')) {
      map.queries[name] = { path: normalized };
    }
  });

  return map;
}

function applyChangedFiles(map, changedFiles) {
  return mergeCapabilityMap(map, {
    meta: {
      ...map.meta,
      changedFiles: changedFiles.slice(),
    },
  });
}

module.exports = {
  defaultCapabilityMap,
  mergeCapabilityMap,
  renderCapabilityMapYaml,
  parseCapabilityMapYaml,
  summarizeCapabilityMap,
  validateCapabilityMap,
  toCapabilityName,
  inferCapabilitiesFromFiles,
  applyChangedFiles,
};
