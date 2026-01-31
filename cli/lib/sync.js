const { loadConfig } = require('./config');
const { collectFiles, buildFileIndex } = require('./introspect');
const {
  inferCapabilitiesFromFiles,
  renderCapabilityMapYaml,
  summarizeCapabilityMap,
} = require('./capability-map');
const { saveCache } = require('./cache');

function resolveCapabilityMapPath({ cwd, path, config, overridePath }) {
  if (overridePath) return overridePath;
  return path.join(cwd, config.capabilityMapPath || 'n.codes.capabilities.yaml');
}

function writeCapabilityMap({ fs, mapPath, map }) {
  fs.writeFileSync(mapPath, renderCapabilityMapYaml(map), 'utf8');
  return mapPath;
}

function buildCapabilityMap({ fileIndex, config }) {
  const base = inferCapabilitiesFromFiles(fileIndex);
  if (config.projectName) {
    base.projectName = config.projectName;
  }
  return base;
}

function runSync({ cwd, fs, path, io, configPath, extensions, excludeDirs }) {
  const { config } = loadConfig({ cwd, fs, path, configPath });
  const files = collectFiles({ cwd, fs, path, extensions, excludeDirs });
  const index = buildFileIndex(files, { cwd, fs, path });
  const map = buildCapabilityMap({ fileIndex: index, config });
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
};
