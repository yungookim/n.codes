const { loadConfig } = require('./config');
const { collectFiles, buildFileIndex, diffFileIndex, selectChangedFiles } = require('./introspect');
const { inferCapabilitiesFromFiles, applyChangedFiles, summarizeCapabilityMap } = require('./capability-map');
const { loadCache, saveCache } = require('./cache');
const { resolveCapabilityMapPath, writeCapabilityMap } = require('./sync');

function buildIncrementalMap({ fileIndex, changedFiles, config }) {
  const base = inferCapabilitiesFromFiles(fileIndex);
  const updated = applyChangedFiles(base, changedFiles);
  if (config.projectName) {
    updated.projectName = config.projectName;
  }
  return updated;
}

function runDev({ cwd, fs, path, io, configPath, extensions, excludeDirs }) {
  const { config } = loadConfig({ cwd, fs, path, configPath });
  const files = collectFiles({ cwd, fs, path, extensions, excludeDirs });
  const index = buildFileIndex(files, { cwd, fs, path });
  const { cache } = loadCache({ cwd, fs, path });
  const previousIndex = cache?.fileIndex || {};
  const diff = diffFileIndex(previousIndex, index);
  const changedFiles = selectChangedFiles(diff);

  const map = buildIncrementalMap({ fileIndex: index, changedFiles, config });
  const mapPath = resolveCapabilityMapPath({ cwd, path, config });

  writeCapabilityMap({ fs, mapPath, map });
  saveCache({ cwd, fs, path, cache: { fileIndex: index } });

  const summary = summarizeCapabilityMap(map);
  io.log(`Incremental capability map updated at ${mapPath}`);
  io.log(`Changed files: ${changedFiles.length}`);
  io.log(`Entities: ${summary.entities}, Actions: ${summary.actions}, Queries: ${summary.queries}, Components: ${summary.components}`);

  return { mapPath, changedFiles, summary };
}

module.exports = {
  buildIncrementalMap,
  runDev,
};
