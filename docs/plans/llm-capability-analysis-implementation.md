# LLM Capability Analysis Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add LLM-based semantic analysis to capability map generation, producing meaningful descriptions and detecting entities from code.

**Architecture:** Static analysis detects routes and resolves imports. LLM analyzes route context to generate descriptions and detect entities. Results are cached per-route with content hashing. Entities are merged across routes into a unified list.

**Tech Stack:** Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`), Node.js native test runner, existing CLI structure.

---

## Task 1: Add Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Add Vercel AI SDK dependencies**

Edit `package.json` to add dependencies:

```json
{
  "dependencies": {
    "ai": "^3.0.0",
    "@ai-sdk/openai": "^0.0.40",
    "@ai-sdk/anthropic": "^0.0.30"
  }
}
```

**Step 2: Install dependencies**

Run: `npm install`
Expected: Dependencies installed without errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add Vercel AI SDK dependencies"
```

---

## Task 2: Import Resolution Module

**Files:**
- Create: `cli/lib/imports.js`
- Create: `cli/tests/imports.test.js`

**Step 1: Write failing test for parseImports**

```javascript
// cli/tests/imports.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

const { parseImports } = require('../lib/imports');

test('parseImports extracts ES module imports', () => {
  const content = `
import { prisma } from '@/lib/prisma';
import type { Booking } from '@prisma/client';
import { BookingService } from '../services/booking';
`;
  const result = parseImports(content);
  assert.equal(result.length, 3);
  assert.equal(result[0].specifier, '@/lib/prisma');
  assert.equal(result[0].isTypeOnly, false);
  assert.equal(result[1].specifier, '@prisma/client');
  assert.equal(result[1].isTypeOnly, true);
  assert.equal(result[2].specifier, '../services/booking');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test 2>&1 | grep -A 5 "parseImports extracts"`
Expected: FAIL with "Cannot find module"

**Step 3: Write parseImports implementation**

```javascript
// cli/lib/imports.js

function parseImports(content) {
  const imports = [];
  const importRegex = /import\s+(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))?\s*from\s+['"]([^'"]+)['"]/g;
  const typeImportRegex = /import\s+type\s+/;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const specifier = match[1];
    const isTypeOnly = typeImportRegex.test(fullMatch);
    imports.push({ specifier, isTypeOnly });
  }

  return imports;
}

module.exports = { parseImports };
```

**Step 4: Run test to verify it passes**

Run: `npm test 2>&1 | grep -A 2 "parseImports extracts"`
Expected: PASS

**Step 5: Write failing test for loadTsConfigPaths**

```javascript
// Add to cli/tests/imports.test.js
const fs = require('fs');
const path = require('path');
const { createTempDir, writeFile } = require('./helpers');
const { loadTsConfigPaths } = require('../lib/imports');

test('loadTsConfigPaths reads path aliases from tsconfig', () => {
  const cwd = createTempDir();
  writeFile(cwd, 'tsconfig.json', JSON.stringify({
    compilerOptions: {
      baseUrl: '.',
      paths: {
        '@/*': ['src/*'],
        '~/*': ['lib/*']
      }
    }
  }));
  const result = loadTsConfigPaths({ cwd, fs, path });
  assert.deepEqual(result['@/*'], ['src/*']);
  assert.deepEqual(result['~/*'], ['lib/*']);
});

test('loadTsConfigPaths returns empty object when no tsconfig', () => {
  const cwd = createTempDir();
  const result = loadTsConfigPaths({ cwd, fs, path });
  assert.deepEqual(result, {});
});
```

**Step 6: Run test to verify it fails**

Run: `npm test 2>&1 | grep -A 2 "loadTsConfigPaths"`
Expected: FAIL

**Step 7: Implement loadTsConfigPaths**

```javascript
// Add to cli/lib/imports.js

function loadTsConfigPaths({ cwd, fs, path }) {
  const tsconfigPath = path.join(cwd, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    return {};
  }
  try {
    const content = fs.readFileSync(tsconfigPath, 'utf8');
    const config = JSON.parse(content);
    return config?.compilerOptions?.paths || {};
  } catch {
    return {};
  }
}

module.exports = { parseImports, loadTsConfigPaths };
```

**Step 8: Run test to verify it passes**

Run: `npm test 2>&1 | grep "loadTsConfigPaths"`
Expected: Both tests PASS

**Step 9: Write failing test for resolveImportPath**

```javascript
// Add to cli/tests/imports.test.js
const { resolveImportPath } = require('../lib/imports');

test('resolveImportPath resolves alias paths', () => {
  const cwd = '/project';
  const paths = { '@/*': ['src/*'] };
  const result = resolveImportPath('@/lib/prisma', {
    cwd,
    fromFile: 'pages/api/test.ts',
    paths,
    path
  });
  assert.equal(result, 'src/lib/prisma');
});

test('resolveImportPath resolves relative paths', () => {
  const result = resolveImportPath('../services/booking', {
    cwd: '/project',
    fromFile: 'pages/api/test.ts',
    paths: {},
    path
  });
  assert.equal(result, 'pages/services/booking');
});

test('resolveImportPath returns null for node_modules', () => {
  const result = resolveImportPath('express', {
    cwd: '/project',
    fromFile: 'pages/api/test.ts',
    paths: {},
    path
  });
  assert.equal(result, null);
});
```

**Step 10: Implement resolveImportPath**

```javascript
// Add to cli/lib/imports.js

function resolveImportPath(specifier, { cwd, fromFile, paths, path }) {
  // Skip node_modules packages
  if (!specifier.startsWith('.') && !specifier.startsWith('@/') && !specifier.startsWith('~/')) {
    // Check if it's an aliased path
    const matchedAlias = Object.keys(paths).find((alias) => {
      const pattern = alias.replace('/*', '');
      return specifier.startsWith(pattern);
    });
    if (!matchedAlias) {
      return null; // node_modules package
    }
  }

  // Resolve alias
  for (const [alias, targets] of Object.entries(paths)) {
    const pattern = alias.replace('/*', '');
    if (specifier.startsWith(pattern)) {
      const suffix = specifier.slice(pattern.length);
      const target = targets[0].replace('/*', '');
      return target + suffix;
    }
  }

  // Resolve relative path
  if (specifier.startsWith('.')) {
    const fromDir = path.dirname(fromFile);
    const resolved = path.normalize(path.join(fromDir, specifier));
    return resolved;
  }

  return null;
}

module.exports = { parseImports, loadTsConfigPaths, resolveImportPath };
```

**Step 11: Run test to verify it passes**

Run: `npm test 2>&1 | grep "resolveImportPath"`
Expected: All 3 tests PASS

**Step 12: Write failing test for buildRouteContext**

```javascript
// Add to cli/tests/imports.test.js
const { buildRouteContext } = require('../lib/imports');

test('buildRouteContext combines route with resolved imports', () => {
  const cwd = createTempDir();
  writeFile(cwd, 'tsconfig.json', JSON.stringify({
    compilerOptions: { paths: { '@/*': ['src/*'] } }
  }));
  writeFile(cwd, 'pages/api/bookings.ts', `
import { prisma } from '@/lib/prisma';
export async function POST(req) { return prisma.booking.create({}); }
`);
  writeFile(cwd, 'src/lib/prisma.ts', `
export const prisma = { booking: { create: () => {} } };
`);

  const result = buildRouteContext({
    cwd,
    routeFile: 'pages/api/bookings.ts',
    fs,
    path
  });

  assert.equal(result.routeFile, 'pages/api/bookings.ts');
  assert.ok(result.routeContent.includes('prisma.booking.create'));
  assert.equal(result.imports.length, 1);
  assert.equal(result.imports[0].path, 'src/lib/prisma.ts');
  assert.ok(result.imports[0].content.includes('export const prisma'));
});
```

**Step 13: Implement buildRouteContext**

```javascript
// Add to cli/lib/imports.js

const MAX_CONTENT_LENGTH = 32000; // ~8K tokens

function buildRouteContext({ cwd, routeFile, fs, path }) {
  const paths = loadTsConfigPaths({ cwd, fs, path });
  const routeFullPath = path.join(cwd, routeFile);
  const routeContent = fs.readFileSync(routeFullPath, 'utf8');

  const parsedImports = parseImports(routeContent);
  const imports = [];
  const typeImports = [];

  for (const imp of parsedImports) {
    const resolved = resolveImportPath(imp.specifier, {
      cwd,
      fromFile: routeFile,
      paths,
      path
    });

    if (!resolved) continue;

    if (imp.isTypeOnly) {
      // Extract type names from import
      const escapedSpecifier = imp.specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const typeMatch = routeContent.match(
        new RegExp(`import\\s+type\\s+\\{([^}]+)\\}\\s+from\\s+['"]${escapedSpecifier}['"]`)
      );
      if (typeMatch) {
        const types = typeMatch[1].split(',').map((t) => t.trim());
        typeImports.push(...types);
      }
      continue;
    }

    // Try to find and read the file
    const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
    let content = null;
    let resolvedPath = null;

    for (const ext of extensions) {
      const tryPath = path.join(cwd, resolved + ext);
      if (fs.existsSync(tryPath)) {
        content = fs.readFileSync(tryPath, 'utf8');
        resolvedPath = resolved + ext;
        break;
      }
      // Try index file
      const indexPath = path.join(cwd, resolved, `index${ext || '.ts'}`);
      if (fs.existsSync(indexPath)) {
        content = fs.readFileSync(indexPath, 'utf8');
        resolvedPath = path.join(resolved, `index${ext || '.ts'}`);
        break;
      }
    }

    if (content && resolvedPath) {
      imports.push({
        path: resolvedPath,
        content: content.slice(0, MAX_CONTENT_LENGTH),
        isTypeOnly: false
      });
    }
  }

  // Truncate total content if needed
  let totalLength = routeContent.length;
  const truncatedImports = imports.map((imp) => {
    if (totalLength + imp.content.length > MAX_CONTENT_LENGTH) {
      const available = Math.max(0, MAX_CONTENT_LENGTH - totalLength);
      totalLength += available;
      return { ...imp, content: imp.content.slice(0, available) };
    }
    totalLength += imp.content.length;
    return imp;
  });

  return {
    routeFile,
    routeContent,
    imports: truncatedImports,
    typeImports
  };
}

module.exports = {
  parseImports,
  loadTsConfigPaths,
  resolveImportPath,
  buildRouteContext
};
```

**Step 14: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 15: Run coverage**

Run: `npm run coverage`
Expected: Coverage above 80%

**Step 16: Commit**

```bash
git add cli/lib/imports.js cli/tests/imports.test.js
git commit -m "Add import resolution module"
```

---

## Task 3: LLM Wrapper Module

**Files:**
- Create: `cli/lib/llm.js`
- Create: `cli/tests/llm.test.js`

**Step 1: Write failing test for getModelConfig**

```javascript
// cli/tests/llm.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

const { getModelConfig, SUPPORTED_MODELS } = require('../lib/llm');

test('SUPPORTED_MODELS contains openai and claude providers', () => {
  assert.ok(SUPPORTED_MODELS.openai);
  assert.ok(SUPPORTED_MODELS.claude);
  assert.ok(SUPPORTED_MODELS.openai.includes('gpt-5-mini'));
  assert.ok(SUPPORTED_MODELS.claude.includes('claude-sonnet-4-5'));
});

test('getModelConfig returns provider config for openai', () => {
  const config = { provider: 'openai', model: 'gpt-5-mini' };
  const result = getModelConfig(config);
  assert.equal(result.provider, 'openai');
  assert.equal(result.model, 'gpt-5-mini');
  assert.equal(result.envVar, 'OPENAI_API_KEY');
});

test('getModelConfig returns provider config for claude', () => {
  const config = { provider: 'claude', model: 'claude-sonnet-4-5' };
  const result = getModelConfig(config);
  assert.equal(result.provider, 'claude');
  assert.equal(result.model, 'claude-sonnet-4-5');
  assert.equal(result.envVar, 'ANTHROPIC_API_KEY');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test 2>&1 | grep -A 2 "SUPPORTED_MODELS"`
Expected: FAIL

**Step 3: Implement getModelConfig and SUPPORTED_MODELS**

```javascript
// cli/lib/llm.js

const SUPPORTED_MODELS = {
  openai: ['gpt-5-mini', 'gpt-5.2'],
  claude: ['claude-sonnet-4-5', 'claude-opus-4-5', 'claude-haiku-4-5']
};

const PROVIDER_ENV_VARS = {
  openai: 'OPENAI_API_KEY',
  claude: 'ANTHROPIC_API_KEY'
};

function getModelConfig(config) {
  const { provider, model } = config;
  return {
    provider,
    model,
    envVar: PROVIDER_ENV_VARS[provider] || null
  };
}

module.exports = {
  SUPPORTED_MODELS,
  getModelConfig
};
```

**Step 4: Run test to verify it passes**

Run: `npm test 2>&1 | grep "getModelConfig\|SUPPORTED_MODELS"`
Expected: All tests PASS

**Step 5: Write failing test for sleep and retry**

```javascript
// Add to cli/tests/llm.test.js
const { sleep, withRetry } = require('../lib/llm');

test('sleep delays execution', async () => {
  const start = Date.now();
  await sleep(50);
  const elapsed = Date.now() - start;
  assert.ok(elapsed >= 45, `Expected >= 45ms, got ${elapsed}ms`);
});

test('withRetry returns result on success', async () => {
  let calls = 0;
  const result = await withRetry(async () => {
    calls++;
    return 'success';
  }, { maxAttempts: 3, baseDelay: 10 });
  assert.equal(result, 'success');
  assert.equal(calls, 1);
});

test('withRetry retries on failure then succeeds', async () => {
  let calls = 0;
  const result = await withRetry(async () => {
    calls++;
    if (calls < 3) throw new Error('fail');
    return 'success';
  }, { maxAttempts: 3, baseDelay: 10 });
  assert.equal(result, 'success');
  assert.equal(calls, 3);
});

test('withRetry throws after max attempts', async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(async () => {
      calls++;
      throw new Error('always fails');
    }, { maxAttempts: 3, baseDelay: 10 }),
    { message: 'always fails' }
  );
  assert.equal(calls, 3);
});
```

**Step 6: Implement sleep and withRetry**

```javascript
// Add to cli/lib/llm.js

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, { maxAttempts = 3, baseDelay = 1000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

module.exports = {
  SUPPORTED_MODELS,
  getModelConfig,
  sleep,
  withRetry
};
```

**Step 7: Run tests**

Run: `npm test 2>&1 | grep "sleep\|withRetry"`
Expected: All tests PASS

**Step 8: Write failing test for createSemaphore**

```javascript
// Add to cli/tests/llm.test.js
const { createSemaphore } = require('../lib/llm');

test('createSemaphore limits concurrency', async () => {
  const semaphore = createSemaphore(2);
  let concurrent = 0;
  let maxConcurrent = 0;

  const task = async () => {
    await semaphore.acquire();
    concurrent++;
    maxConcurrent = Math.max(maxConcurrent, concurrent);
    await sleep(20);
    concurrent--;
    semaphore.release();
  };

  await Promise.all([task(), task(), task(), task()]);
  assert.equal(maxConcurrent, 2);
});
```

**Step 9: Implement createSemaphore**

```javascript
// Add to cli/lib/llm.js

function createSemaphore(limit) {
  let current = 0;
  const queue = [];

  return {
    acquire() {
      return new Promise((resolve) => {
        if (current < limit) {
          current++;
          resolve();
        } else {
          queue.push(resolve);
        }
      });
    },
    release() {
      current--;
      if (queue.length > 0) {
        current++;
        const next = queue.shift();
        next();
      }
    }
  };
}

module.exports = {
  SUPPORTED_MODELS,
  getModelConfig,
  sleep,
  withRetry,
  createSemaphore
};
```

**Step 10: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 11: Write analyzeWithLLM (integration test, skipped without API key)**

```javascript
// Add to cli/tests/llm.test.js
const { analyzeWithLLM } = require('../lib/llm');

test('analyzeWithLLM returns fallback when no API key', async () => {
  const routeContext = {
    routeFile: 'pages/api/test.ts',
    routeContent: 'export function GET() { return Response.json({}); }',
    imports: [],
    typeImports: []
  };
  const config = { provider: 'openai', model: 'gpt-5-mini' };
  const heuristicDescription = 'Fallback description';

  // With no API key set, should return fallback
  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const result = await analyzeWithLLM({
    routeContext,
    method: 'GET',
    path: '/api/test',
    config,
    heuristicDescription
  });

  process.env.OPENAI_API_KEY = originalKey;

  assert.equal(result.fallback, true);
  assert.equal(result.description, heuristicDescription);
});
```

**Step 12: Implement analyzeWithLLM**

```javascript
// Add to cli/lib/llm.js

async function analyzeWithLLM({
  routeContext,
  method,
  path,
  config,
  heuristicDescription
}) {
  const modelConfig = getModelConfig(config);
  const apiKey = process.env[modelConfig.envVar];

  if (!apiKey) {
    return {
      fallback: true,
      description: heuristicDescription,
      entities: []
    };
  }

  try {
    const { generateText } = await import('ai');
    let model;

    if (config.provider === 'openai') {
      const { openai } = await import('@ai-sdk/openai');
      model = openai(config.model);
    } else if (config.provider === 'claude') {
      const { anthropic } = await import('@ai-sdk/anthropic');
      model = anthropic(config.model);
    } else {
      throw new Error(`Unsupported provider: ${config.provider}`);
    }

    const prompt = buildAnalysisPrompt({ routeContext, method, path });

    const result = await withRetry(async () => {
      const { text } = await generateText({
        model,
        prompt,
        maxTokens: 1500
      });
      return text;
    }, { maxAttempts: 3, baseDelay: 1000 });

    const parsed = parseAnalysisResponse(result);
    return {
      fallback: false,
      description: parsed.description || heuristicDescription,
      entities: parsed.entities || []
    };
  } catch (error) {
    return {
      fallback: true,
      description: heuristicDescription,
      entities: [],
      error: error.message
    };
  }
}

function buildAnalysisPrompt({ routeContext, method, path }) {
  const language = routeContext.routeFile.endsWith('.ts') ? 'typescript' : 'javascript';

  let prompt = `You are analyzing an API route to document its capabilities.

## Route Information
- Method: ${method}
- Path: ${path}
- File: ${routeContext.routeFile}

## Route Code
\`\`\`${language}
${routeContext.routeContent}
\`\`\`
`;

  if (routeContext.imports.length > 0) {
    prompt += '\n## Imported Dependencies\n';
    for (const imp of routeContext.imports) {
      const impLang = imp.path.endsWith('.ts') ? 'typescript' : 'javascript';
      prompt += `\n### ${imp.path}\n\`\`\`${impLang}\n${imp.content}\n\`\`\`\n`;
    }
  }

  prompt += `
## Task
Analyze this route and respond in JSON only (no markdown code blocks):

{
  "description": "A 2-3 sentence description of what this endpoint does, its purpose, and key behavior",
  "entities": [
    {
      "name": "EntityName",
      "fields": ["field1", "field2"],
      "source": "prisma" | "typescript" | "inferred"
    }
  ]
}`;

  return prompt;
}

function parseAnalysisResponse(text) {
  // Try to extract JSON from response
  let jsonStr = text.trim();

  // Handle markdown code blocks
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      description: parsed.description || null,
      entities: Array.isArray(parsed.entities) ? parsed.entities : []
    };
  } catch {
    return { description: null, entities: [] };
  }
}

module.exports = {
  SUPPORTED_MODELS,
  getModelConfig,
  sleep,
  withRetry,
  createSemaphore,
  analyzeWithLLM,
  buildAnalysisPrompt,
  parseAnalysisResponse
};
```

**Step 13: Run all tests and coverage**

Run: `npm run coverage`
Expected: Coverage above 80%

**Step 14: Commit**

```bash
git add cli/lib/llm.js cli/tests/llm.test.js
git commit -m "Add LLM wrapper module with retry and concurrency"
```

---

## Task 4: Analyzer Module

**Files:**
- Create: `cli/lib/analyzer.js`
- Create: `cli/tests/analyzer.test.js`

**Step 1: Write failing test for mergeEntities**

```javascript
// cli/tests/analyzer.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

const { mergeEntities } = require('../lib/analyzer');

test('mergeEntities combines entities from multiple routes', () => {
  const routeResults = [
    {
      routeFile: 'pages/api/bookings.ts',
      capabilityName: 'postBookings',
      entities: [
        { name: 'Booking', fields: ['id', 'userId'], source: 'prisma' }
      ]
    },
    {
      routeFile: 'pages/api/bookings/[id].ts',
      capabilityName: 'getBooking',
      entities: [
        { name: 'Booking', fields: ['id', 'status', 'startTime'], source: 'prisma' },
        { name: 'User', fields: ['id', 'email'], source: 'typescript' }
      ]
    }
  ];

  const merged = mergeEntities(routeResults);

  assert.ok(merged.Booking);
  assert.deepEqual(merged.Booking.fields.sort(), ['id', 'startTime', 'status', 'userId']);
  assert.deepEqual(merged.Booking.sources, ['prisma']);
  assert.deepEqual(merged.Booking.referencedBy.sort(), ['getBooking', 'postBookings']);

  assert.ok(merged.User);
  assert.deepEqual(merged.User.fields, ['id', 'email']);
  assert.deepEqual(merged.User.referencedBy, ['getBooking']);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test 2>&1 | grep -A 2 "mergeEntities"`
Expected: FAIL

**Step 3: Implement mergeEntities**

```javascript
// cli/lib/analyzer.js

function mergeEntities(routeResults) {
  const entities = {};

  for (const route of routeResults) {
    for (const entity of route.entities || []) {
      const name = entity.name;
      if (!entities[name]) {
        entities[name] = {
          fields: [],
          sources: [],
          referencedBy: []
        };
      }

      // Merge fields (dedupe)
      for (const field of entity.fields || []) {
        if (!entities[name].fields.includes(field)) {
          entities[name].fields.push(field);
        }
      }

      // Merge sources (dedupe)
      if (entity.source && !entities[name].sources.includes(entity.source)) {
        entities[name].sources.push(entity.source);
      }

      // Add reference
      if (!entities[name].referencedBy.includes(route.capabilityName)) {
        entities[name].referencedBy.push(route.capabilityName);
      }
    }
  }

  return entities;
}

module.exports = { mergeEntities };
```

**Step 4: Run test to verify it passes**

Run: `npm test 2>&1 | grep "mergeEntities"`
Expected: PASS

**Step 5: Write failing test for normalizeEntityName**

```javascript
// Add to cli/tests/analyzer.test.js
const { normalizeEntityName } = require('../lib/analyzer');

test('normalizeEntityName converts to PascalCase', () => {
  assert.equal(normalizeEntityName('booking'), 'Booking');
  assert.equal(normalizeEntityName('user_profile'), 'UserProfile');
  assert.equal(normalizeEntityName('API-Key'), 'ApiKey');
  assert.equal(normalizeEntityName('BookingReference'), 'BookingReference');
});
```

**Step 6: Implement normalizeEntityName**

```javascript
// Add to cli/lib/analyzer.js

function normalizeEntityName(name) {
  if (!name) return '';
  return name
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '');
}

module.exports = { mergeEntities, normalizeEntityName };
```

**Step 7: Run tests**

Run: `npm test 2>&1 | grep "normalizeEntityName"`
Expected: PASS

**Step 8: Write failing test for buildRouteAnalysisResult**

```javascript
// Add to cli/tests/analyzer.test.js
const { buildRouteAnalysisResult } = require('../lib/analyzer');

test('buildRouteAnalysisResult structures LLM response', () => {
  const llmResult = {
    fallback: false,
    description: 'Creates a new booking',
    entities: [{ name: 'booking', fields: ['id'], source: 'inferred' }]
  };

  const result = buildRouteAnalysisResult({
    routeFile: 'pages/api/bookings.ts',
    capabilityName: 'postBookings',
    method: 'POST',
    path: '/api/bookings',
    llmResult
  });

  assert.equal(result.description, 'Creates a new booking');
  assert.equal(result.analysisSource, 'llm');
  assert.equal(result.entities[0].name, 'Booking'); // normalized
});

test('buildRouteAnalysisResult marks heuristic fallback', () => {
  const llmResult = {
    fallback: true,
    description: 'Heuristic description',
    entities: []
  };

  const result = buildRouteAnalysisResult({
    routeFile: 'pages/api/bookings.ts',
    capabilityName: 'postBookings',
    method: 'POST',
    path: '/api/bookings',
    llmResult
  });

  assert.equal(result.analysisSource, 'heuristic');
});
```

**Step 9: Implement buildRouteAnalysisResult**

```javascript
// Add to cli/lib/analyzer.js

function buildRouteAnalysisResult({
  routeFile,
  capabilityName,
  method,
  path,
  llmResult
}) {
  const normalizedEntities = (llmResult.entities || []).map((entity) => ({
    name: normalizeEntityName(entity.name),
    fields: entity.fields || [],
    source: entity.source || 'inferred'
  }));

  return {
    routeFile,
    capabilityName,
    method,
    path,
    description: llmResult.description,
    entities: normalizedEntities,
    analysisSource: llmResult.fallback ? 'heuristic' : 'llm'
  };
}

module.exports = {
  mergeEntities,
  normalizeEntityName,
  buildRouteAnalysisResult
};
```

**Step 10: Run all tests and coverage**

Run: `npm run coverage`
Expected: Coverage above 80%

**Step 11: Commit**

```bash
git add cli/lib/analyzer.js cli/tests/analyzer.test.js
git commit -m "Add analyzer module for entity merging and result building"
```

---

## Task 5: Extend Cache Module

**Files:**
- Modify: `cli/lib/cache.js`
- Modify: `cli/tests/cache.test.js`

**Step 1: Write failing test for hashContent**

```javascript
// Add to cli/tests/cache.test.js
const { hashContent } = require('../lib/cache');

test('hashContent returns consistent sha256 hash', () => {
  const content = 'test content';
  const hash1 = hashContent(content);
  const hash2 = hashContent(content);
  assert.equal(hash1, hash2);
  assert.ok(hash1.startsWith('sha256:'));
  assert.equal(hash1.length, 7 + 64); // 'sha256:' + 64 hex chars
});

test('hashContent returns different hash for different content', () => {
  const hash1 = hashContent('content a');
  const hash2 = hashContent('content b');
  assert.notEqual(hash1, hash2);
});
```

**Step 2: Implement hashContent**

```javascript
// Add to cli/lib/cache.js
const crypto = require('crypto');

function hashContent(content) {
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return `sha256:${hash}`;
}

// Export it
module.exports = {
  resolveCachePath,
  loadCache,
  saveCache,
  hashContent
};
```

**Step 3: Run test to verify it passes**

Run: `npm test 2>&1 | grep "hashContent"`
Expected: PASS

**Step 4: Write failing test for getAnalysisCache / setAnalysisCache**

```javascript
// Add to cli/tests/cache.test.js
const { getAnalysisCache, setAnalysisCache } = require('../lib/cache');

test('getAnalysisCache returns null for missing entry', () => {
  const cache = { analysis: {} };
  const result = getAnalysisCache(cache, 'pages/api/test.ts', 'sha256:abc');
  assert.equal(result, null);
});

test('getAnalysisCache returns null for hash mismatch', () => {
  const cache = {
    analysis: {
      'pages/api/test.ts': {
        contentHash: 'sha256:old',
        result: { description: 'test' }
      }
    }
  };
  const result = getAnalysisCache(cache, 'pages/api/test.ts', 'sha256:new');
  assert.equal(result, null);
});

test('getAnalysisCache returns result for matching hash', () => {
  const cache = {
    analysis: {
      'pages/api/test.ts': {
        contentHash: 'sha256:abc',
        result: { description: 'test' }
      }
    }
  };
  const result = getAnalysisCache(cache, 'pages/api/test.ts', 'sha256:abc');
  assert.deepEqual(result, { description: 'test' });
});

test('setAnalysisCache stores entry', () => {
  const cache = { analysis: {} };
  setAnalysisCache(cache, 'pages/api/test.ts', 'sha256:abc', { description: 'test' });
  assert.equal(cache.analysis['pages/api/test.ts'].contentHash, 'sha256:abc');
  assert.deepEqual(cache.analysis['pages/api/test.ts'].result, { description: 'test' });
});
```

**Step 5: Implement getAnalysisCache and setAnalysisCache**

```javascript
// Add to cli/lib/cache.js

function getAnalysisCache(cache, routeFile, contentHash) {
  if (!cache?.analysis?.[routeFile]) return null;
  const entry = cache.analysis[routeFile];
  if (entry.contentHash !== contentHash) return null;
  return entry.result;
}

function setAnalysisCache(cache, routeFile, contentHash, result) {
  if (!cache.analysis) cache.analysis = {};
  cache.analysis[routeFile] = {
    contentHash,
    analyzedAt: new Date().toISOString(),
    result
  };
}

module.exports = {
  resolveCachePath,
  loadCache,
  saveCache,
  hashContent,
  getAnalysisCache,
  setAnalysisCache
};
```

**Step 6: Run all tests and coverage**

Run: `npm run coverage`
Expected: Coverage above 80%

**Step 7: Commit**

```bash
git add cli/lib/cache.js cli/tests/cache.test.js
git commit -m "Extend cache with content hashing and analysis storage"
```

---

## Task 6: Update Capability Map Output Format

**Files:**
- Modify: `cli/lib/capability-map.js`
- Modify: `cli/tests/capability-map.test.js`

**Step 1: Write failing test for enrichCapabilityWithAnalysis**

```javascript
// Add to cli/tests/capability-map.test.js
const { enrichCapabilityWithAnalysis } = require('../lib/capability-map');

test('enrichCapabilityWithAnalysis adds LLM fields to action', () => {
  const action = {
    endpoint: { method: 'POST', path: '/api/bookings' },
    description: 'Original heuristic description'
  };

  const analysisResult = {
    description: 'LLM generated description',
    entities: [{ name: 'Booking', fields: ['id'], source: 'prisma' }],
    analysisSource: 'llm'
  };

  const enriched = enrichCapabilityWithAnalysis(action, analysisResult);

  assert.equal(enriched.description, 'LLM generated description');
  assert.deepEqual(enriched.entities, ['Booking']);
  assert.equal(enriched.analysisSource, 'llm');
});

test('enrichCapabilityWithAnalysis preserves heuristic source', () => {
  const action = {
    endpoint: { method: 'POST', path: '/api/bookings' },
    description: 'Heuristic description'
  };

  const analysisResult = {
    description: 'Heuristic description',
    entities: [],
    analysisSource: 'heuristic'
  };

  const enriched = enrichCapabilityWithAnalysis(action, analysisResult);

  assert.equal(enriched.analysisSource, 'heuristic');
});
```

**Step 2: Implement enrichCapabilityWithAnalysis**

```javascript
// Add to cli/lib/capability-map.js

function enrichCapabilityWithAnalysis(capability, analysisResult) {
  return {
    ...capability,
    description: analysisResult.description || capability.description,
    entities: (analysisResult.entities || []).map((e) => e.name),
    analysisSource: analysisResult.analysisSource || 'heuristic'
  };
}

// Add to exports
module.exports = {
  // ... existing exports
  enrichCapabilityWithAnalysis
};
```

**Step 3: Run test to verify it passes**

Run: `npm test 2>&1 | grep "enrichCapabilityWithAnalysis"`
Expected: PASS

**Step 4: Add serialization test for new format**

```javascript
// Add to cli/tests/capability-map.test.js
test('renderCapabilityMapYaml includes entities section with fields', () => {
  const map = {
    version: 1,
    generatedAt: '2026-02-01T00:00:00Z',
    projectName: 'test',
    entities: {
      Booking: {
        fields: ['id', 'userId'],
        sources: ['prisma'],
        referencedBy: ['postBookings']
      }
    },
    actions: {
      postBookings: {
        endpoint: { method: 'POST', path: '/api/bookings' },
        description: 'Creates a booking',
        entities: ['Booking'],
        analysisSource: 'llm'
      }
    },
    queries: {},
    components: {},
    meta: { filesAnalyzed: 1 }
  };

  const yaml = renderCapabilityMapYaml(map);

  assert.ok(yaml.includes('entities:'));
  assert.ok(yaml.includes('Booking:'));
  assert.ok(yaml.includes('fields:'));
  assert.ok(yaml.includes('analysisSource: "llm"'));
});
```

**Step 5: Run test to verify it passes**

Run: `npm test 2>&1 | grep "renderCapabilityMapYaml includes entities"`
Expected: PASS

**Step 6: Run all tests and coverage**

Run: `npm run coverage`
Expected: Coverage above 80%

**Step 7: Commit**

```bash
git add cli/lib/capability-map.js cli/tests/capability-map.test.js
git commit -m "Add enrichCapabilityWithAnalysis for LLM-enhanced output"
```

---

## Task 7: Integrate LLM Analysis into Sync

**Files:**
- Modify: `cli/lib/sync.js`
- Modify: `cli/tests/sync.test.js`

**Step 1: Write failing test for analyzeRoutesWithLLM**

```javascript
// Add to cli/tests/sync.test.js
const { analyzeRoutesWithLLM } = require('../lib/sync');

test('analyzeRoutesWithLLM returns results for each route', async () => {
  // Mock LLM to return fallback (no API key)
  const routes = [
    { name: 'postBookings', method: 'POST', path: '/api/bookings', file: 'pages/api/bookings.ts' },
    { name: 'getBooking', method: 'GET', path: '/api/bookings/:id', file: 'pages/api/bookings/[id].ts' }
  ];

  const cwd = createTempDir();
  writeFile(cwd, 'pages/api/bookings.ts', 'export function POST() {}');
  writeFile(cwd, 'pages/api/bookings/[id].ts', 'export function GET() {}');

  const config = { provider: 'openai', model: 'gpt-5-mini' };

  const results = await analyzeRoutesWithLLM({
    routes,
    cwd,
    fs,
    path,
    config,
    concurrency: 2,
    io: { log: () => {}, error: () => {} }
  });

  assert.equal(results.length, 2);
  assert.equal(results[0].capabilityName, 'postBookings');
  assert.equal(results[0].analysisSource, 'heuristic'); // No API key = fallback
});
```

**Step 2: Implement analyzeRoutesWithLLM in sync.js**

See the design document for the full implementation that:
- Uses semaphore for concurrency control
- Builds route context via imports.js
- Checks cache before LLM calls
- Falls back to heuristics on failure
- Updates cache with results

**Step 3: Update runSync to return a Promise and use LLM analysis**

The sync module will need to become async and integrate all the new modules.

**Step 4: Run all tests and coverage**

Run: `npm run coverage`
Expected: Coverage above 80%

**Step 5: Commit**

```bash
git add cli/lib/sync.js cli/tests/sync.test.js
git commit -m "Integrate LLM analysis into sync command"
```

---

## Task 8: Add --force Flag to CLI

**Files:**
- Modify: `cli/bin.js`
- Modify: `cli/tests/bin.test.js`

**Step 1: Update dispatchCommand to pass force flag to sync**

**Step 2: Write test for --force flag**

**Step 3: Run tests**

**Step 4: Commit**

```bash
git add cli/bin.js cli/lib/args.js cli/tests/bin.test.js
git commit -m "Add --force flag to sync command"
```

---

## Task 9: Update Dev Mode for Incremental Analysis

**Files:**
- Modify: `cli/lib/dev.js`
- Modify: `cli/tests/dev.test.js`

**Step 1: Update buildIncrementalMap to use LLM analysis for changed files only**

**Step 2: Run all tests and coverage**

**Step 3: Commit**

```bash
git add cli/lib/dev.js cli/tests/dev.test.js
git commit -m "Add incremental LLM analysis to dev mode"
```

---

## Task 10: Update Sample Outputs

**Files:**
- Update: `samples/test-output/*/n.codes.capabilities.yaml`

**Step 1: Regenerate sample capability maps**

Run: `npm run sample:capability-map`

**Step 2: Verify new format**

**Step 3: Commit**

```bash
git add samples/
git commit -m "Update sample outputs with LLM-enhanced format"
```

---

## Task 11: Final Integration Test

**Step 1: Run full test suite and coverage**

Run: `npm run coverage`
Expected: All tests pass, coverage above 80%

**Step 2: Manual smoke test with API key**

**Step 3: Create final commit**

```bash
git add -A
git commit -m "Complete LLM capability analysis implementation"
```

---

## Summary

| Task | Module | Description |
|------|--------|-------------|
| 1 | package.json | Add Vercel AI SDK dependencies |
| 2 | imports.js | Parse imports, resolve aliases, build route context |
| 3 | llm.js | LLM wrapper with retry, concurrency, provider config |
| 4 | analyzer.js | Entity merging, result building, normalization |
| 5 | cache.js | Content hashing, analysis caching |
| 6 | capability-map.js | Enrich capabilities with LLM analysis |
| 7 | sync.js | Integrate LLM analysis into sync flow |
| 8 | bin.js | Add --force flag |
| 9 | dev.js | Incremental LLM analysis |
| 10 | samples/ | Update sample outputs |
| 11 | - | Final integration testing |
