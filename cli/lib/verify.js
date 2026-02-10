const { loadConfig } = require('./config');
const { resolveCapabilityMapPath } = require('./sync');
const { parseCapabilityMapYaml, validateCapabilityMap } = require('./capability-map');
const { detectFramework } = require('./detect-framework');

function checkConfigExists({ cwd, fs, path, configPath }) {
  const { exists } = loadConfig({ cwd, fs, path, configPath });
  return {
    name: 'Config exists',
    passed: exists,
    message: exists
      ? 'n.codes.config.json found'
      : 'n.codes.config.json not found. Run: npx ncodes init --auto',
  };
}

function checkCapabilityMapExists({ cwd, fs, path, config }) {
  const mapPath = resolveCapabilityMapPath({ cwd, path, config });
  const exists = fs.existsSync(mapPath);
  return {
    name: 'Capability map exists',
    passed: exists,
    message: exists
      ? `${config.capabilityMapPath || 'n.codes.capabilities.yaml'} found`
      : 'Capability map not found. Run: npx ncodes sync',
  };
}

function checkCapabilityMapValid({ cwd, fs, path, config }) {
  const mapPath = resolveCapabilityMapPath({ cwd, path, config });
  if (!fs.existsSync(mapPath)) {
    return {
      name: 'Capability map valid',
      passed: false,
      message: 'Capability map not found — skipping validation',
    };
  }
  try {
    const content = fs.readFileSync(mapPath, 'utf8');
    const map = parseCapabilityMapYaml(content);
    const result = validateCapabilityMap(map);
    return {
      name: 'Capability map valid',
      passed: result.valid,
      message: result.valid
        ? 'Capability map passes validation'
        : `Validation errors: ${result.errors.join(', ')}. Run: npx ncodes sync --force`,
    };
  } catch (error) {
    return {
      name: 'Capability map valid',
      passed: false,
      message: `Parse error: ${error.message}. Run: npx ncodes sync --force`,
    };
  }
}

function checkJsonCapabilityMap({ cwd, fs, path, config }) {
  const mapPath = resolveCapabilityMapPath({ cwd, path, config });
  const jsonPath = mapPath.replace(/\.yaml$/, '.json');
  const exists = fs.existsSync(jsonPath);
  return {
    name: 'JSON capability map exists',
    passed: exists,
    message: exists
      ? 'JSON capability map found'
      : 'JSON capability map not found. Run: npx ncodes sync',
  };
}

function checkWidgetInstalled({ cwd, fs, path }) {
  const widgetPath = path.join(cwd, 'node_modules', '@ncodes', 'widget');
  const exists = fs.existsSync(widgetPath);
  return {
    name: 'Widget package installed',
    passed: exists,
    message: exists
      ? '@ncodes/widget installed'
      : '@ncodes/widget not found. Run: npm install @ncodes/widget',
  };
}

function checkInstallMdExists({ cwd, fs, path }) {
  const installPath = path.join(cwd, '.n.codes', 'INSTALL.md');
  const exists = fs.existsSync(installPath);
  return {
    name: 'INSTALL.md exists',
    passed: exists,
    message: exists
      ? '.n.codes/INSTALL.md found'
      : '.n.codes/INSTALL.md not found. Run: npx ncodes install',
  };
}

function checkWidgetIntegration({ cwd, fs, path }) {
  const framework = detectFramework({ cwd, fs, path });
  const layoutFiles = getLayoutFiles(framework);
  for (const file of layoutFiles) {
    const fullPath = path.join(cwd, file);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    const hasIntegration = lines.some(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*') || trimmed.startsWith('<!--')) return false;
      return trimmed.includes('NCodes.init(') || trimmed.includes('@ncodes/widget');
    });
    if (hasIntegration) {
      return {
        name: 'Widget integration code',
        passed: true,
        message: `Widget integration found in ${file}`,
      };
    }
  }
  return {
    name: 'Widget integration code',
    passed: false,
    message: 'No widget integration found in layout files. Follow .n.codes/INSTALL.md instructions',
  };
}

function getLayoutFiles(framework) {
  switch (framework) {
    case 'next-app-router':
      return [
        'app/layout.tsx', 'app/layout.jsx', 'app/layout.js',
        'src/app/layout.tsx', 'src/app/layout.jsx', 'src/app/layout.js',
      ];
    case 'next-pages-router':
      return [
        'pages/_app.tsx', 'pages/_app.jsx', 'pages/_app.js',
        'src/pages/_app.tsx', 'src/pages/_app.jsx', 'src/pages/_app.js',
      ];
    case 'sveltekit':
      return ['src/app.html', 'src/routes/+layout.svelte'];
    case 'vue-vite':
      return ['index.html', 'src/App.vue'];
    case 'express':
      return ['views/layout.ejs', 'views/layout.hbs', 'views/layout.pug', 'index.html'];
    default:
      return ['index.html', 'public/index.html'];
  }
}

function runVerify({ cwd, fs, path, io, configPath }) {
  const { config } = loadConfig({ cwd, fs, path, configPath });

  const checks = [
    checkConfigExists({ cwd, fs, path, configPath }),
    checkCapabilityMapExists({ cwd, fs, path, config }),
    checkCapabilityMapValid({ cwd, fs, path, config }),
    checkJsonCapabilityMap({ cwd, fs, path, config }),
    checkWidgetInstalled({ cwd, fs, path }),
    checkInstallMdExists({ cwd, fs, path }),
    checkWidgetIntegration({ cwd, fs, path }),
  ];

  const passed = checks.filter((c) => c.passed).length;
  const failed = checks.filter((c) => !c.passed).length;

  for (const check of checks) {
    const tag = check.passed ? '[PASS]' : '[FAIL]';
    io.log(`${tag} ${check.name}: ${check.message}`);
  }

  io.log(`\n${passed}/${checks.length} checks passed.`);
  if (failed > 0) {
    io.log('Fix the failing checks above and re-run: npx ncodes verify');
  }

  return { checks, passed, failed, allPassed: failed === 0 };
}

module.exports = {
  checkConfigExists,
  checkCapabilityMapExists,
  checkCapabilityMapValid,
  checkJsonCapabilityMap,
  checkWidgetInstalled,
  checkInstallMdExists,
  checkWidgetIntegration,
  getLayoutFiles,
  runVerify,
};
