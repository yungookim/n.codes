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

module.exports = {
  resolveCachePath,
  loadCache,
  saveCache,
};
