const fs = require('fs');
const path = require('path');

const root = process.cwd();
const introspect = require(path.join(root, 'cli', 'lib', 'introspect'));
const capabilityMap = require(path.join(root, 'cli', 'lib', 'capability-map'));

const { collectFiles, buildFileIndex } = introspect;
const {
  inferCapabilitiesFromFiles,
  renderCapabilityMapYaml,
  summarizeCapabilityMap,
  validateCapabilityMap,
} = capabilityMap;

const samples = ['cal.com', 'medusa', 'react-admin', 'refine', 'tailadmin'];

samples.forEach((name) => {
  const source = path.join(root, 'samples', name);
  const output = path.join(root, 'samples', 'test-output', name);
  if (!fs.existsSync(output)) {
    fs.mkdirSync(output, { recursive: true });
  }

  const files = collectFiles({ cwd: source, fs, path });
  const index = buildFileIndex(files, { cwd: source, fs, path });
  const map = inferCapabilitiesFromFiles(index, {
    readFile: (filePath) => fs.readFileSync(path.join(source, filePath), 'utf8'),
  });
  map.projectName = name;
  map.generatedAt = new Date().toISOString();

  const mapPath = path.join(output, 'n.codes.capabilities.yaml');
  fs.writeFileSync(mapPath, renderCapabilityMapYaml(map), 'utf8');

  const configPath = path.join(output, 'n.codes.config.json');
  const config = {
    provider: 'openai',
    model: 'default',
    projectName: name,
    capabilityMapPath: 'n.codes.capabilities.yaml',
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

  const summary = summarizeCapabilityMap(map);
  const validation = validateCapabilityMap(map);
  const runLog = [
    'n.codes sample test',
    `app: ${name}`,
    `source: ${source}`,
    `output: ${output}`,
    `generatedAt: ${map.generatedAt}`,
    `filesAnalyzed: ${map.meta.filesAnalyzed}`,
    `entities: ${summary.entities}`,
    `actions: ${summary.actions}`,
    `queries: ${summary.queries}`,
    `components: ${summary.components}`,
    `valid: ${validation.valid}`,
  ].join('\n');
  fs.writeFileSync(path.join(output, 'run.log'), `${runLog}\n`, 'utf8');
});

console.log('Sample outputs regenerated.');
