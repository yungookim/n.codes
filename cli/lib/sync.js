const { loadConfig } = require('./config');
const { collectFiles, buildFileIndex } = require('./introspect');
const {
  inferCapabilitiesFromFiles,
  renderCapabilityMapYaml,
  summarizeCapabilityMap,
  enrichCapabilityWithAnalysis,
} = require('./capability-map');
const { saveCache, loadCache, hashContent, getAnalysisCache, setAnalysisCache } = require('./cache');
const { buildRouteContext } = require('./imports');
const { analyzeWithLLM, createSemaphore } = require('./llm');
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
  const results = [];

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

      const routeContent = fs.readFileSync(routeFullPath, 'utf8');
      const contentHash = hashContent(routeContent);

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

      // Build route context with imports
      const routeContext = buildRouteContext({
        cwd,
        routeFile: route.file,
        fs,
        path
      });

      // Generate heuristic description as fallback
      const heuristicDescription = `Handles ${route.method} requests to ${route.path}. Processes the request and returns a response.`;

      // Call LLM for analysis
      const llmResult = await analyzeWithLLM({
        routeContext,
        method: route.method,
        path: route.path,
        config,
        heuristicDescription
      });

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
    }
  });

  const taskResults = await Promise.all(tasks);
  return taskResults;
}

function runSync({ cwd, fs, path, io, configPath, extensions, excludeDirs, force = false }) {
  const { config } = loadConfig({ cwd, fs, path, configPath });
  const files = collectFiles({ cwd, fs, path, extensions, excludeDirs });
  const index = buildFileIndex(files, { cwd, fs, path });
  const map = buildCapabilityMap({
    fileIndex: index,
    config,
    readFile: (filePath) => fs.readFileSync(path.join(cwd, filePath), 'utf8'),
  });
  const mapPath = resolveCapabilityMapPath({ cwd, path, config });

  writeCapabilityMap({ fs, mapPath, map });
  saveCache({ cwd, fs, path, cache: { fileIndex: index } });

  const summary = summarizeCapabilityMap(map);
  io.log(`Capability map written to ${mapPath}`);
  io.log(`Entities: ${summary.entities}, Actions: ${summary.actions}, Queries: ${summary.queries}, Components: ${summary.components}`);

  return { mapPath, summary };
}

module.exports = {
  resolveCapabilityMapPath,
  writeCapabilityMap,
  buildCapabilityMap,
  runSync,
  analyzeRoutesWithLLM,
};
