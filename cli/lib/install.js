/**
 * n.codes install command — generates LLM-friendly installation instructions.
 */

const { detectFramework } = require('./detect-framework');
const { VERSION } = require('./version');

const TEMPLATE_FILES = {
  'next-app-router': 'install-next-app.md',
  'next-pages-router': 'install-next-pages.md',
  'express': 'install-express.md',
  'vue-vite': 'install-vue-vite.md',
  'sveltekit': 'install-sveltekit.md',
  'generic': 'install-generic.md',
};

function runInstall({ cwd, fs, path, io }) {
  const framework = detectFramework({ cwd, fs, path });
  const templateFile = TEMPLATE_FILES[framework] || TEMPLATE_FILES.generic;
  const templatePath = path.join(__dirname, 'templates', templateFile);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Installation template not found: ${templateFile}`);
  }

  let template = fs.readFileSync(templatePath, 'utf8');

  // Resolve the capability map JSON path
  const capabilityMapPath = resolveCapabilityJsonPath({ cwd, fs, path });

  // Replace template variables
  template = template.replace(/\{\{capabilityMapPath\}\}/g, capabilityMapPath);
  template = template.replace(/\{\{version\}\}/g, VERSION);
  template = template.replace(/\{\{timestamp\}\}/g, new Date().toISOString());

  // Write to .n.codes/INSTALL.md
  const outputDir = path.join(cwd, '.n.codes');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'INSTALL.md');
  fs.writeFileSync(outputPath, template, 'utf8');

  io.log(`Detected framework: ${framework}`);
  io.log(`Installation instructions written to ${outputPath}`);
  io.log('');
  io.log('Next steps:');
  io.log('  Give .n.codes/INSTALL.md to your AI coding assistant:');
  io.log('  "Follow the instructions in .n.codes/INSTALL.md to install n.codes"');

  return { framework, outputPath };
}

function resolveCapabilityJsonPath({ cwd, fs, path }) {
  // Check if JSON exists
  const jsonPath = path.join(cwd, 'n.codes.capabilities.json');
  if (fs.existsSync(jsonPath)) {
    return 'n.codes.capabilities.json';
  }

  // Check if YAML exists (user might need to run sync first)
  const yamlPath = path.join(cwd, 'n.codes.capabilities.yaml');
  if (fs.existsSync(yamlPath)) {
    return 'n.codes.capabilities.json';
  }

  // Default — will be created by sync
  return 'n.codes.capabilities.json';
}

module.exports = { runInstall, TEMPLATE_FILES };
