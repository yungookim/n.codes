const { loadConfig } = require('./config');
const { parseCapabilityMapYaml, validateCapabilityMap } = require('./capability-map');
const { resolveCapabilityMapPath } = require('./sync');

function readCapabilityMap({ fs, mapPath }) {
  const raw = fs.readFileSync(mapPath, 'utf8');
  return parseCapabilityMapYaml(raw);
}

function runValidate({ cwd, fs, path, io, configPath }) {
  const { config } = loadConfig({ cwd, fs, path, configPath });
  const mapPath = resolveCapabilityMapPath({ cwd, path, config });
  const map = readCapabilityMap({ fs, mapPath });
  const result = validateCapabilityMap(map);

  if (result.valid) {
    io.log(`Capability map is valid: ${mapPath}`);
  } else {
    io.error(`Capability map has ${result.errors.length} error(s):`);
    result.errors.forEach((error) => io.error(`- ${error}`));
  }

  return { mapPath, result };
}

module.exports = {
  readCapabilityMap,
  runValidate,
};
