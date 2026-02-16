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
  return serializeYaml(map);
}

function parseCapabilityMapYaml(content) {
  const parsed = parseYaml(content);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Capability map must be a YAML object.');
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

function serializeYaml(value, indent = 0) {
  const padding = ' '.repeat(indent);
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return value.map((item) => {
      const rendered = serializeYaml(item, indent + 2);
      if (isScalar(item)) {
        return `${padding}- ${rendered}`;
      }
      return `${padding}-\n${rendered}`;
    }).join('\n');
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    return entries.map(([key, val]) => {
      const rendered = serializeYaml(val, indent + 2);
      if (isScalar(val)) {
        return `${padding}${key}: ${rendered}`;
      }
      return `${padding}${key}:\n${rendered}`;
    }).join('\n');
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  return String(value);
}

function parseYaml(content) {
  const lines = content.split(/\r?\n/);
  const [value] = parseYamlBlock(lines, 0, 0);
  return value;
}

function parseYamlBlock(lines, startIndex, indent) {
  let index = nextNonEmptyLine(lines, startIndex);
  if (index >= lines.length) return [null, index];
  const lineIndent = countIndent(lines[index]);
  if (lineIndent < indent) return [null, index];
  const trimmed = lines[index].slice(lineIndent);
  if (trimmed.startsWith('- ')) {
    return parseYamlArray(lines, index, indent);
  }
  if (!trimmed.includes(':')) {
    return [parseYamlScalar(trimmed.trim()), index + 1];
  }
  return parseYamlObject(lines, index, indent);
}

function parseYamlArray(lines, startIndex, indent) {
  const result = [];
  let index = startIndex;
  while (index < lines.length) {
    index = nextNonEmptyLine(lines, index);
    if (index >= lines.length) break;
    const line = lines[index];
    const lineIndent = countIndent(line);
    if (lineIndent < indent) break;
    if (lineIndent !== indent) {
      throw new Error(`Invalid YAML indentation at line ${index + 1}.`);
    }
    const trimmed = line.slice(lineIndent);
    if (!trimmed.startsWith('-') || (trimmed.length > 1 && trimmed[1] !== ' ')) break;
    const remainder = trimmed.length > 1 ? trimmed.slice(2).trim() : '';
    if (!remainder) {
      const [value, nextIndex] = parseYamlBlock(lines, index + 1, indent + 2);
      result.push(value);
      index = nextIndex;
      continue;
    }
    result.push(parseYamlScalar(remainder));
    index += 1;
  }
  return [result, index];
}

function parseYamlObject(lines, startIndex, indent) {
  const result = {};
  let index = startIndex;
  while (index < lines.length) {
    index = nextNonEmptyLine(lines, index);
    if (index >= lines.length) break;
    const line = lines[index];
    const lineIndent = countIndent(line);
    if (lineIndent < indent) break;
    if (lineIndent !== indent) {
      throw new Error(`Invalid YAML indentation at line ${index + 1}.`);
    }
    const trimmed = line.slice(lineIndent);
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      throw new Error(`Invalid YAML object entry at line ${index + 1}.`);
    }
    const key = trimmed.slice(0, colonIndex).trim();
    const remainder = trimmed.slice(colonIndex + 1).trim();
    if (!remainder) {
      const [value, nextIndex] = parseYamlBlock(lines, index + 1, indent + 2);
      result[key] = value;
      index = nextIndex;
      continue;
    }
    result[key] = parseYamlScalar(remainder);
    index += 1;
  }
  return [result, index];
}

function parseYamlScalar(value) {
  if (value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === '[]') return [];
  if (value === '{}') return {};
  if (value.startsWith('"')) {
    return JSON.parse(value);
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  return value;
}

function nextNonEmptyLine(lines, startIndex) {
  let index = startIndex;
  while (index < lines.length) {
    const line = lines[index];
    if (!line || !line.trim() || line.trim().startsWith('#')) {
      index += 1;
      continue;
    }
    return index;
  }
  return lines.length;
}

function countIndent(line) {
  let count = 0;
  while (count < line.length && line[count] === ' ') {
    count += 1;
  }
  return count;
}

function isScalar(value) {
  if (value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return true;
}

function isTestFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const file = normalized.split('/').pop() || '';
  if (normalized.includes('/__tests__/') || normalized.includes('/tests/') || normalized.includes('/test/')) {
    return true;
  }
  return /\.(test|spec|e2e-spec|integration-test)\.[jt]sx?$/.test(file);
}

function inferActionEntriesFromPath(filePath, { readFile } = {}) {
  const routeInfo = inferActionRouteInfo(filePath);
  if (!routeInfo) return [];
  const methods = inferActionMethods(routeInfo, { readFile });
  if (!methods.length) return [];
  const includeMethodInName = methods.length > 1;
  return methods.map((method) => {
    const path = routeInfo.path;
    return {
      name: buildActionName({
        baseName: routeInfo.baseName,
        method,
        path,
        includeMethodInName,
      }),
      method,
      path,
    };
  });
}

function inferActionRouteInfo(filePath) {
  if (isTestFile(filePath)) return null;
  const normalized = filePath.replace(/\\/g, '/');
  const segments = normalized.split('/').filter(Boolean);
  const file = segments[segments.length - 1] || '';
  const baseName = file.replace(/\.[^.]+$/, '');
  const nextPagesIndex = findSegmentSequence(segments, ['pages', 'api']);
  if (nextPagesIndex !== -1) {
    const routeSegments = segments.slice(nextPagesIndex + 2);
    const basePrefix = buildApiPrefix(segments.slice(0, nextPagesIndex));
    return {
      path: buildRoutePath({ routeSegments, baseName, basePrefix, style: 'next-pages' }),
      baseName,
      filePath: normalized,
    };
  }
  const nextAppIndex = findSegmentSequence(segments, ['app', 'api']);
  if (nextAppIndex !== -1) {
    const routeSegments = segments.slice(nextAppIndex + 2);
    const basePrefix = buildApiPrefix(segments.slice(0, nextAppIndex));
    return {
      path: buildRoutePath({ routeSegments, baseName, basePrefix, style: 'next-app' }),
      baseName,
      filePath: normalized,
    };
  }
  const routesIndex = segments.lastIndexOf('routes');
  if (routesIndex !== -1) {
    const routeSegments = segments.slice(routesIndex + 1);
    const basePrefix = buildRoutesPrefix(segments.slice(0, routesIndex));
    return {
      path: buildRoutePath({ routeSegments, baseName, basePrefix, style: 'routes' }),
      baseName,
      filePath: normalized,
    };
  }
  const controllerIndex = segments.lastIndexOf('controllers');
  if (controllerIndex !== -1 && /\.controller\.[jt]sx?$/.test(file)) {
    const routeSegments = [baseName.replace(/\.controller$/, '')];
    const basePrefix = buildApiPrefix(segments.slice(0, controllerIndex));
    return {
      path: buildRoutePath({ routeSegments, baseName, basePrefix, style: 'controllers' }),
      baseName,
      filePath: normalized,
    };
  }
  const apiIndex = findApiRootIndex(segments);
  if (apiIndex !== -1) {
    const routeSegments = segments.slice(apiIndex + 1);
    return {
      path: buildRoutePath({ routeSegments, baseName, basePrefix: '/api', style: 'api-folder' }),
      baseName,
      filePath: normalized,
    };
  }
  return null;
}

const READ_METHODS = new Set(['GET', 'HEAD']);

function buildRoutePath({ routeSegments, baseName, basePrefix, style }) {
  const segments = routeSegments.slice(0, -1);
  const fileSegment = normalizeFileSegment(baseName, style);
  if (fileSegment) {
    segments.push(fileSegment);
  }
  const cleaned = segments.filter(Boolean).map(normalizeRouteSegment);
  const prefix = basePrefix ? basePrefix.replace(/\/+$/, '') : '';
  const path = `${prefix}/${cleaned.join('/')}`.replace(/\/+/g, '/');
  return path.startsWith('/') ? path : `/${path}`;
}

function normalizeFileSegment(baseName, style) {
  if (!baseName) return '';
  if (baseName === 'index') return '';
  if (style === 'next-app' && baseName === 'route') return '';
  if (baseName.startsWith('+')) return '';
  if (baseName.startsWith('_')) {
    return '';
  }
  return baseName;
}

function normalizeRouteSegment(segment) {
  if (!segment) return '';
  let token = segment;
  while (token.startsWith('[') && token.endsWith(']')) {
    token = token.slice(1, -1);
  }
  if (token.startsWith('...')) {
    return `:${token.slice(3)}*`;
  }
  if (segment.startsWith('[') && segment.endsWith(']')) {
    return `:${token}`;
  }
  return segment;
}

function buildApiPrefix(segments) {
  const version = findVersionSegment(segments);
  if (version) {
    return `/api/${version}`;
  }
  return '/api';
}

function buildRoutesPrefix(segments) {
  const version = findVersionSegment(segments);
  const hasApi = segments.includes('api');
  const parts = [];
  if (hasApi) parts.push('api');
  if (version) parts.push(version);
  if (parts.length === 0) return '';
  return `/${parts.join('/')}`;
}

function findVersionSegment(segments) {
  return segments.find((segment) => /^v\d+$/i.test(segment)) || null;
}

function findSegmentSequence(segments, sequence) {
  if (sequence.length === 0) return -1;
  for (let i = 0; i <= segments.length - sequence.length; i += 1) {
    if (sequence.every((segment, offset) => segments[i + offset] === segment)) {
      return i;
    }
  }
  return -1;
}

function findApiRootIndex(segments) {
  for (let i = 0; i < segments.length; i += 1) {
    if (segments[i] !== 'api') continue;
    const prev = segments[i - 1];
    if (['src', 'lib', 'server', 'app'].includes(prev)) {
      return i;
    }
  }
  return -1;
}

function inferHttpMethod(baseName) {
  if (!baseName) return null;
  const normalized = baseName.replace(/^_+/, '').toLowerCase();
  const method = HTTP_METHODS[normalized];
  return method || null;
}

function buildActionDescription({ method, path }) {
  const analysis = analyzePath(path);
  const sentences = [];
  if (analysis.actionVerb) {
    const actionLabel = humanizeSegment(analysis.actionVerb);
    sentences.push(`${capitalize(actionLabel)} ${withArticle(analysis.singularLabel)}${analysis.paramHint}.`);
    sentences.push(`Use this ${method} endpoint to ${actionLabel} the ${analysis.singularLabel} and return the updated ${analysis.singularLabel} or a confirmation.`);
  } else {
    switch (method) {
      case 'GET':
        if (analysis.hasParams) {
          sentences.push(`Retrieves a single ${analysis.singularLabel}${analysis.paramHint}.`);
          sentences.push(`Use this endpoint to fetch ${analysis.singularLabel} details without modifying state.`);
        } else {
          sentences.push(`Lists ${analysis.resourceLabel} for the API consumer.`);
          sentences.push(`Use this endpoint to fetch ${analysis.resourceLabel} and apply query filters or pagination when available.`);
        }
        break;
      case 'POST':
        sentences.push(`Creates ${withArticle(analysis.singularLabel)}${analysis.paramHint}.`);
        sentences.push(`Send the ${analysis.singularLabel} payload in the request body and receive the created ${analysis.singularLabel} in the response.`);
        break;
      case 'PUT':
      case 'PATCH':
        sentences.push(`Updates ${withArticle(analysis.singularLabel)}${analysis.paramHint}.`);
        sentences.push(`Send the fields to update in the request body and receive the updated ${analysis.singularLabel}.`);
        break;
      case 'DELETE':
        sentences.push(`Deletes ${withArticle(analysis.singularLabel)}${analysis.paramHint}.`);
        sentences.push(`Use this endpoint to remove the ${analysis.singularLabel} and receive a confirmation response.`);
        break;
      default:
        sentences.push(`Performs a ${method} operation on ${analysis.resourceLabel}.`);
        sentences.push(`Use this endpoint to execute the ${analysis.resourceLabel} action and return its result.`);
        break;
    }
  }
  if (analysis.params.length > 0) {
    sentences.push(`Path parameters: ${analysis.params.join(', ')}.`);
  }
  return sentences.join(' ');
}

function buildQueryDescription({ path }) {
  const analysis = analyzePath(path);
  const sentences = [];
  if (analysis.hasParams) {
    sentences.push(`Reads a single ${analysis.singularLabel}${analysis.paramHint}.`);
    sentences.push(`Use this query to fetch ${analysis.singularLabel} data without side effects.`);
  } else {
    sentences.push(`Reads ${analysis.resourceLabel} for display or reporting.`);
    sentences.push(`Use this query to fetch ${analysis.resourceLabel} with optional filters or pagination.`);
  }
  if (analysis.params.length > 0) {
    sentences.push(`Path parameters: ${analysis.params.join(', ')}.`);
  }
  return sentences.join(' ');
}

function analyzePath(path) {
  const segments = path.split('/').filter(Boolean);
  const params = segments.filter((segment) => segment.startsWith(':') || segment.startsWith('*'))
    .map((segment) => segment.replace(/^[:*]/, '').replace(/\*$/, ''));
  const resourceSegments = segments.filter((segment) => segment !== 'api' && !/^v\d+$/i.test(segment))
    .filter((segment) => !segment.startsWith(':') && !segment.startsWith('*'));
  const lastSegment = resourceSegments[resourceSegments.length - 1] || 'resource';
  const actionVerb = isActionVerb(lastSegment) ? lastSegment : null;
  const resourceName = actionVerb ? (resourceSegments[resourceSegments.length - 2] || 'resource') : (resourceSegments[0] || 'resource');
  const resourceLabel = humanizeSegment(resourceName);
  const singularLabel = singularize(resourceLabel);
  const hasParams = params.length > 0;
  const paramHint = hasParams ? ` identified by ${params.join(', ')}` : '';
  return {
    params,
    resourceLabel,
    singularLabel,
    actionVerb,
    hasParams,
    paramHint,
  };
}

function inferActionMethods(routeInfo, { readFile } = {}) {
  const methodFromName = inferHttpMethod(routeInfo.baseName);
  if (methodFromName) return [methodFromName];
  if (!readFile) return [];
  const content = safeReadFile(readFile, routeInfo.filePath);
  if (!content) return [];
  return inferHttpMethodsFromContent(content);
}

function inferHttpMethodsFromContent(content) {
  const methods = new Set();
  addMethodsFromRegex(methods, content, /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g);
  addMethodsFromRegex(methods, content, /export\s+const\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g);
  addMethodsFromRegex(methods, content, /req\.method\s*===\s*['"](GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)['"]/g);
  addMethodsFromRegex(methods, content, /case\s+['"](GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)['"]/g);
  addMethodsFromRegex(methods, content, /\b(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s*:\s*async\s*\(/g);
  addRouterMethods(methods, content);
  return Array.from(methods).sort((a, b) => methodOrderIndex(a) - methodOrderIndex(b));
}

function addMethodsFromRegex(methods, content, regex) {
  let match;
  while ((match = regex.exec(content)) !== null) {
    methods.add(match[1]);
  }
}

function addRouterMethods(methods, content) {
  const regex = /\.(get|post|put|patch|delete|options|head)\s*\(/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    methods.add(match[1].toUpperCase());
  }
}

function methodOrderIndex(method) {
  const index = METHOD_ORDER.indexOf(method);
  return index === -1 ? METHOD_ORDER.length : index;
}

function safeReadFile(readFile, filePath) {
  try {
    const content = readFile(filePath);
    if (content === null || content === undefined) return '';
    return String(content);
  } catch (error) {
    return '';
  }
}

function buildActionName({ baseName, method, path, includeMethodInName }) {
  const normalizedBase = normalizeBaseName(baseName);
  const methodLower = method.toLowerCase();
  if (normalizedBase && !['index', 'route'].includes(normalizedBase)) {
    if (normalizedBase === methodLower) {
      const analysis = analyzePath(path);
      const nameSource = analysis.hasParams ? analysis.singularLabel : analysis.resourceLabel;
      const resourceName = toCamelCase(nameSource);
      if (resourceName) {
        return `${methodLower}${capitalize(resourceName)}`;
      }
    }
    if (normalizedBase.endsWith(methodLower)) return normalizedBase;
    if (includeMethodInName) {
      return `${methodLower}${capitalize(normalizedBase)}`;
    }
    return normalizedBase;
  }
  const analysis = analyzePath(path);
  const nameSource = analysis.hasParams ? analysis.singularLabel : analysis.resourceLabel;
  const resourceName = toCamelCase(nameSource);
  if (resourceName) {
    return `${methodLower}${capitalize(resourceName)}`;
  }
  return `${methodLower}Action`;
}

function normalizeBaseName(baseName) {
  if (!baseName) return '';
  const cleaned = baseName.replace(/^_+/, '');
  return toCamelCase(cleaned);
}

function toCamelCase(text) {
  return text.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(' ').map((part, index) => {
    if (!part) return '';
    const lower = part.toLowerCase();
    if (index === 0) return lower;
    return lower[0].toUpperCase() + lower.slice(1);
  }).join('');
}

function ensureUniqueName(name, usedNames) {
  let candidate = name || 'action';
  if (!usedNames.has(candidate)) {
    usedNames.add(candidate);
    return candidate;
  }
  let index = 2;
  while (usedNames.has(`${candidate}${index}`)) {
    index += 1;
  }
  const next = `${candidate}${index}`;
  usedNames.add(next);
  return next;
}

function isActionVerb(segment) {
  return ACTION_VERBS.has(segment.toLowerCase());
}

function humanizeSegment(segment) {
  return segment.replace(/[_-]+/g, ' ').trim();
}

function singularize(word) {
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.endsWith('sses')) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function withArticle(word) {
  if (word.endsWith('s')) return `the ${word}`;
  const first = word[0]?.toLowerCase() || '';
  if (['a', 'e', 'i', 'o', 'u'].includes(first)) return `an ${word}`;
  return `a ${word}`;
}

function capitalize(word) {
  if (!word) return word;
  return word[0].toUpperCase() + word.slice(1);
}

const HTTP_METHODS = {
  get: 'GET',
  post: 'POST',
  put: 'PUT',
  patch: 'PATCH',
  delete: 'DELETE',
  del: 'DELETE',
  options: 'OPTIONS',
  head: 'HEAD',
};

const METHOD_ORDER = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

const ACTION_VERBS = new Set([
  'add',
  'approve',
  'archive',
  'assign',
  'authorize',
  'cancel',
  'confirm',
  'create',
  'delete',
  'disable',
  'enable',
  'invite',
  'join',
  'mark',
  'publish',
  'reject',
  'remove',
  'reschedule',
  'reset',
  'revoke',
  'ship',
  'sync',
  'unpublish',
  'update',
  'verify',
]);

function inferCapabilityMapAndRoutes(fileIndex, { readFile } = {}) {
  const map = defaultCapabilityMap();
  const routes = [];
  const filePaths = Object.keys(fileIndex);
  map.meta.filesAnalyzed = filePaths.length;
  const usedActionNames = new Set();
  const usedQueryNames = new Set();

  filePaths.forEach((filePath) => {
    const normalized = filePath.replace(/\\/g, '/');
    const name = toCapabilityName(normalized);
    if (!name) return;

    if (normalized.includes('/components/')) {
      map.components[name] = { path: normalized };
      return;
    }
    const actionEntries = inferActionEntriesFromPath(normalized, { readFile });
    if (actionEntries.length) {
      actionEntries.forEach((entry) => {
        if (READ_METHODS.has(entry.method)) {
          const queryName = ensureUniqueName(entry.name || name, usedQueryNames);
          map.queries[queryName] = {
            endpoint: { method: entry.method, path: entry.path },
            description: buildQueryDescription({ path: entry.path }),
          };
          routes.push({
            name: queryName,
            method: entry.method,
            path: entry.path,
            file: normalized,
          });
          return;
        }
        const actionName = ensureUniqueName(entry.name || name, usedActionNames);
        map.actions[actionName] = {
          endpoint: { method: entry.method, path: entry.path },
          description: buildActionDescription({ method: entry.method, path: entry.path }),
        };
        routes.push({
          name: actionName,
          method: entry.method,
          path: entry.path,
          file: normalized,
        });
      });
      return;
    }
  });

  return { map, routes };
}

function inferCapabilitiesFromFiles(fileIndex, { readFile } = {}) {
  return inferCapabilityMapAndRoutes(fileIndex, { readFile }).map;
}

function applyChangedFiles(map, changedFiles) {
  return mergeCapabilityMap(map, {
    meta: {
      ...map.meta,
      changedFiles: changedFiles.slice(),
    },
  });
}

function enrichCapabilityWithAnalysis(capability, analysisResult) {
  const enriched = {
    ...capability,
    description: analysisResult.description || capability.description,
    entities: (analysisResult.entities || []).map((e) => e.name),
    analysisSource: analysisResult.analysisSource || 'heuristic'
  };
  if (analysisResult.responseFormat) {
    enriched.responseFormat = analysisResult.responseFormat;
  }
  if (analysisResult.queryParams && analysisResult.queryParams.length > 0) {
    enriched.queryParams = analysisResult.queryParams;
  }
  if (analysisResult.requestBody && analysisResult.requestBody.length > 0) {
    enriched.requestBody = analysisResult.requestBody;
  }
  return enriched;
}

module.exports = {
  defaultCapabilityMap,
  mergeCapabilityMap,
  renderCapabilityMapYaml,
  parseCapabilityMapYaml,
  summarizeCapabilityMap,
  validateCapabilityMap,
  toCapabilityName,
  inferCapabilityMapAndRoutes,
  inferCapabilitiesFromFiles,
  applyChangedFiles,
  enrichCapabilityWithAnalysis,
};
