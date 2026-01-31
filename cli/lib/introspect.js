function defaultExtensions() {
  return ['.js', '.jsx', '.ts', '.tsx'];
}

function shouldIncludeFile(filePath, { extensions, excludeDirs }) {
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  if (excludeDirs.some((dir) => parts.includes(dir))) {
    return false;
  }
  return extensions.some((ext) => normalized.endsWith(ext));
}

function isExcludedDir(dirPath, excludeDirs) {
  const normalized = dirPath.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  return excludeDirs.some((dir) => parts.includes(dir));
}

function collectFiles({ cwd, fs, path, extensions = defaultExtensions(), excludeDirs = ['node_modules', '.git', 'dist', 'build'] }) {
  const results = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach((entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const relDir = path.relative(cwd, entryPath);
        if (isExcludedDir(relDir, excludeDirs)) {
          return;
        }
        walk(entryPath);
        return;
      }
      const relativePath = path.relative(cwd, entryPath);
      if (shouldIncludeFile(relativePath, { extensions, excludeDirs })) {
        results.push(relativePath);
      }
    });
  }

  walk(cwd);
  return results;
}

function buildFileIndex(files, { cwd, fs, path }) {
  const index = {};
  files.forEach((relativePath) => {
    const fullPath = path.join(cwd, relativePath);
    const stat = fs.statSync(fullPath);
    index[relativePath] = { size: stat.size, mtimeMs: stat.mtimeMs };
  });
  return index;
}

function diffFileIndex(previous, next) {
  const added = [];
  const removed = [];
  const changed = [];
  const unchanged = [];

  const prevKeys = new Set(Object.keys(previous || {}));
  const nextKeys = new Set(Object.keys(next || {}));

  nextKeys.forEach((filePath) => {
    if (!prevKeys.has(filePath)) {
      added.push(filePath);
      return;
    }
    const prevMeta = previous[filePath];
    const nextMeta = next[filePath];
    if (prevMeta.mtimeMs !== nextMeta.mtimeMs || prevMeta.size !== nextMeta.size) {
      changed.push(filePath);
    } else {
      unchanged.push(filePath);
    }
  });

  prevKeys.forEach((filePath) => {
    if (!nextKeys.has(filePath)) {
      removed.push(filePath);
    }
  });

  return { added, removed, changed, unchanged };
}

function selectChangedFiles(diff) {
  return [...diff.added, ...diff.changed];
}

module.exports = {
  defaultExtensions,
  shouldIncludeFile,
  isExcludedDir,
  collectFiles,
  buildFileIndex,
  diffFileIndex,
  selectChangedFiles,
};
