const { loadConfig } = require('./config');
const { collectFiles, buildFileIndex } = require('./introspect');
const {
  inferCapabilitiesFromFiles,
  inferCapabilityMapAndRoutes,
  renderCapabilityMapYaml,
  summarizeCapabilityMap,
  enrichCapabilityWithAnalysis,
} = require('./capability-map');
const { saveCache, loadCache, hashContent, getAnalysisCache, setAnalysisCache } = require('./cache');
const { buildRouteContext } = require('./imports');
const { analyzeWithLLM, createSemaphore, assertApiKey } = require('./llm');
const { buildRouteAnalysisResult, mergeEntities } = require('./analyzer');

function resolveCapabilityMapPath({ cwd, path, config, overridePath }) {
  if (overridePath) return overridePath;
  return path.join(cwd, config.capabilityMapPath || 'n.codes.capabilities.yaml');
}

function writeCapabilityMap({ fs, mapPath, map }) {
  fs.writeFileSync(mapPath, renderCapabilityMapYaml(map), 'utf8');
  return mapPath;
}

function buildCapabilityMap({ fileIndex, config, readFile }) {
  const base = inferCapabilitiesFromFiles(fileIndex, { readFile });
  if (config.projectName) {
    base.projectName = config.projectName;
  }
  return base;
}

function buildRouteContextHash(routeContext) {
  if (!routeContext.imports || routeContext.imports.length === 0) {
    return hashContent(routeContext.routeContent || '');
  }
  const parts = [routeContext.routeContent || ''];
  for (const imp of routeContext.imports) {
    parts.push(`\n/* ${imp.path} */\n${imp.content || ''}`);
  }
  if (routeContext.typeImports && routeContext.typeImports.length) {
    parts.push(`\n/* types */\n${routeContext.typeImports.join(',')}`);
  }
  return hashContent(parts.join('\n'));
}

function sortRoutesForSampling(routes) {
  return routes.slice().sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    if (a.method !== b.method) return a.method.localeCompare(b.method);
    if (a.path !== b.path) return a.path.localeCompare(b.path);
    return a.name.localeCompare(b.name);
  });
}

function sampleRoutes(routes, sample) {
  if (!sample || sample <= 0 || sample >= routes.length) return routes;
  return sortRoutesForSampling(routes).slice(0, sample);
}

async function analyzeRoutesWithLLM({
  routes,
  cwd,
  fs,
  path,
  config,
  concurrency = 3,
  io,
  cache,
  force = false
}) {
  const semaphore = createSemaphore(concurrency);
  const total = routes.length;
  let completed = 0;

  if (total > 0) {
    assertApiKey(config);
  }

  if (io && typeof io.log === 'function' && total > 0) {
    io.log(`Analyzing routes... [0/${total}]`);
  }

  const tasks = routes.map(async (route) => {
    await semaphore.acquire();

    try {
      // Read route file content
      const routeFullPath = path.join(cwd, route.file);
      if (!fs.existsSync(routeFullPath)) {
        return {
          routeFile: route.file,
          capabilityName: route.name,
          method: route.method,
          path: route.path,
          description: `Handles ${route.method} requests to ${route.path}`,
          entities: [],
          analysisSource: 'heuristic'
        };
      }

      // Build route context with imports
      const routeContext = buildRouteContext({
        cwd,
        routeFile: route.file,
        fs,
        path
      });

      const contentHash = buildRouteContextHash(routeContext);

      // Check cache unless force flag is set
      if (!force) {
        const cached = getAnalysisCache(cache, route.file, contentHash);
        if (cached) {
          return {
            routeFile: route.file,
            capabilityName: route.name,
            method: route.method,
            path: route.path,
            description: cached.description,
            entities: cached.entities || [],
            analysisSource: cached.analysisSource || 'llm'
          };
        }
      }

      // Generate heuristic description as fallback
      const heuristicDescription = `Handles ${route.method} requests to ${route.path}. Processes the request and returns a response.`;

      // Call LLM for analysis
      let llmResult;
      try {
        llmResult = await analyzeWithLLM({
          routeContext,
          method: route.method,
          path: route.path,
          config,
          heuristicDescription
        });
      } catch (error) {
        const message = `LLM analysis failed for ${route.file} (${route.method} ${route.path}): ${error.message}`;
        throw new Error(message);
      }

      const analysisResult = buildRouteAnalysisResult({
        routeFile: route.file,
        capabilityName: route.name,
        method: route.method,
        path: route.path,
        llmResult
      });

      // Update cache
      setAnalysisCache(cache, route.file, contentHash, {
        description: analysisResult.description,
        entities: analysisResult.entities,
        analysisSource: analysisResult.analysisSource
      });

      return analysisResult;
    } finally {
      semaphore.release();
      completed += 1;
      if (io && typeof io.log === 'function' && total > 0) {
        io.log(`Analyzing routes... [${completed}/${total}]`);
      }
    }
  });

  const taskResults = await Promise.all(tasks);
  return taskResults;
}

async function runSync({ cwd, fs, path, io, configPath, extensions, excludeDirs, force = false, sample = null }) {
  const { config } = loadConfig({ cwd, fs, path, configPath });
  const files = collectFiles({ cwd, fs, path, extensions, excludeDirs });
  const index = buildFileIndex(files, { cwd, fs, path });
  const { map, routes } = inferCapabilityMapAndRoutes(index, {
    readFile: (filePath) => fs.readFileSync(path.join(cwd, filePath), 'utf8'),
  });
  if (config.projectName) {
    map.projectName = config.projectName;
  }

  const { cache } = loadCache({ cwd, fs, path });
  const activeCache = cache || {};
  let analysisResults = [];

  if (routes.length > 0) {
    const sampledRoutes = sampleRoutes(routes, sample);
    if (sampledRoutes.length !== routes.length) {
      io.log(`Sampling ${sampledRoutes.length} of ${routes.length} routes for LLM analysis.`);
    }
    analysisResults = await analyzeRoutesWithLLM({
      routes: sampledRoutes,
      cwd,
      fs,
      path,
      config,
      io,
      cache: activeCache,
      force
    });
    const entities = mergeEntities(analysisResults);
    map.entities = entities;
    activeCache.entities = entities;

    analysisResults.forEach((result) => {
      if (map.actions[result.capabilityName]) {
        map.actions[result.capabilityName] = enrichCapabilityWithAnalysis(
          map.actions[result.capabilityName],
          result
        );
        return;
      }
      if (map.queries[result.capabilityName]) {
        map.queries[result.capabilityName] = enrichCapabilityWithAnalysis(
          map.queries[result.capabilityName],
          result
        );
      }
    });
  }

  activeCache.fileIndex = index;
  saveCache({ cwd, fs, path, cache: activeCache });

  const mapPath = resolveCapabilityMapPath({ cwd, path, config });

  writeCapabilityMap({ fs, mapPath, map });

  // Also output JSON for widget consumption
  const jsonPath = mapPath.replace(/\.yaml$/, '.json');
  fs.writeFileSync(jsonPath, JSON.stringify(map, null, 2), 'utf8');

  const summary = summarizeCapabilityMap(map);
  io.log(`Capability map written to ${mapPath}`);
  io.log(`JSON capability map written to ${jsonPath}`);
  io.log(`Entities: ${summary.entities}, Actions: ${summary.actions}, Queries: ${summary.queries}, Components: ${summary.components}`);

  if (analysisResults.length > 0) {
    const llmCount = analysisResults.filter((result) => result.analysisSource === 'llm').length;
    const heuristicCount = analysisResults.length - llmCount;
    io.log(`${analysisResults.length} routes analyzed (${llmCount} LLM, ${heuristicCount} heuristic fallback)`);
    if (heuristicCount > 0) {
      const failed = analysisResults.filter((result) => result.analysisSource === 'heuristic');
      const sample = failed.slice(0, 5).map((result) => result.capabilityName).join(', ');
      io.log(`Heuristic fallback: ${sample}${failed.length > 5 ? ', ...' : ''}`);
      io.log('Use --force to retry failed routes.');
    }
  }

  return { mapPath, summary };
}

module.exports = {
  resolveCapabilityMapPath,
  writeCapabilityMap,
  buildCapabilityMap,
  buildRouteContextHash,
  runSync,
  analyzeRoutesWithLLM,
};
