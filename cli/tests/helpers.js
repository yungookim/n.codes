const fs = require('fs');
const os = require('os');
const path = require('path');

function createTempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ncodes-'));
  return dir;
}

function writeFile(dir, relativePath, contents) {
  const fullPath = path.join(dir, relativePath);
  const folder = path.dirname(fullPath);
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(fullPath, contents, 'utf8');
  return fullPath;
}

function listFiles(dir) {
  const results = [];
  function walk(folder) {
    const entries = fs.readdirSync(folder, { withFileTypes: true });
    entries.forEach((entry) => {
      const entryPath = path.join(folder, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else {
        results.push(path.relative(dir, entryPath));
      }
    });
  }
  walk(dir);
  return results;
}

module.exports = {
  createTempDir,
  writeFile,
  listFiles,
};
