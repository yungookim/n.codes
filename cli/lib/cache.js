const crypto = require('crypto');

function resolveCachePath({ cwd, path }) {
  return path.join(cwd, '.n.codes.cache.json');
}

function loadCache({ cwd, fs, path }) {
  const cachePath = resolveCachePath({ cwd, path });
  if (!fs.existsSync(cachePath)) {
    return { cache: null, exists: false, path: cachePath };
  }
  const raw = fs.readFileSync(cachePath, 'utf8');
  const cache = JSON.parse(raw);
  return { cache, exists: true, path: cachePath };
}

function saveCache({ cwd, fs, path, cache }) {
  const cachePath = resolveCachePath({ cwd, path });
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
  return cachePath;
}

function hashContent(content) {
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return `sha256:${hash}`;
}

function makeCacheKey(routeFile, method) {
  return method ? `${routeFile}:${method}` : routeFile;
}

function getAnalysisCache(cache, routeFile, contentHash, method) {
  const key = makeCacheKey(routeFile, method);
  if (!cache?.analysis?.[key]) return null;
  const entry = cache.analysis[key];
  if (entry.contentHash !== contentHash) return null;
  return entry.result;
}

function setAnalysisCache(cache, routeFile, contentHash, result, method) {
  if (!cache.analysis) cache.analysis = {};
  const key = makeCacheKey(routeFile, method);
  cache.analysis[key] = {
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
