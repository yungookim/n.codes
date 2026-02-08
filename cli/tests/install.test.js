const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { runInstall, TEMPLATE_FILES } = require('../lib/install');
const { createMemoryIO } = require('../lib/io');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ncodes-install-'));
}

function writeFile(cwd, relativePath, content) {
  const fullPath = path.join(cwd, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

function writePackageJson(cwd, deps = {}, devDeps = {}) {
  writeFile(cwd, 'package.json', JSON.stringify({
    dependencies: deps,
    devDependencies: devDeps,
  }));
}

test('TEMPLATE_FILES maps all frameworks to template filenames', () => {
  assert.ok(TEMPLATE_FILES['next-app-router']);
  assert.ok(TEMPLATE_FILES['next-pages-router']);
  assert.ok(TEMPLATE_FILES['express']);
  assert.ok(TEMPLATE_FILES['vue-vite']);
  assert.ok(TEMPLATE_FILES['sveltekit']);
  assert.ok(TEMPLATE_FILES['generic']);
});

test('runInstall generates INSTALL.md for Next.js App Router', () => {
  const cwd = createTempDir();
  writePackageJson(cwd, { next: '^14.0.0' });
  writeFile(cwd, 'app/layout.tsx', 'export default function Layout() {}');
  const io = createMemoryIO();

  const result = runInstall({ cwd, fs, path, io });

  assert.equal(result.framework, 'next-app-router');
  assert.ok(fs.existsSync(result.outputPath));
  const content = fs.readFileSync(result.outputPath, 'utf8');
  assert.ok(content.includes('framework: next-app-router'));
  assert.ok(content.includes('npm install @ncodes/widget'));
  assert.ok(content.includes('app/layout.tsx'));
});

test('runInstall generates INSTALL.md for Express', () => {
  const cwd = createTempDir();
  writePackageJson(cwd, { express: '^4.18.0' });
  const io = createMemoryIO();

  const result = runInstall({ cwd, fs, path, io });

  assert.equal(result.framework, 'express');
  const content = fs.readFileSync(result.outputPath, 'utf8');
  assert.ok(content.includes('framework: express'));
  assert.ok(content.includes('ncodes-widget.js'));
});

test('runInstall generates INSTALL.md for generic project', () => {
  const cwd = createTempDir();
  const io = createMemoryIO();

  const result = runInstall({ cwd, fs, path, io });

  assert.equal(result.framework, 'generic');
  const content = fs.readFileSync(result.outputPath, 'utf8');
  assert.ok(content.includes('framework: generic'));
  assert.ok(content.includes('Script Tag'));
});

test('runInstall creates .n.codes directory', () => {
  const cwd = createTempDir();
  const io = createMemoryIO();

  runInstall({ cwd, fs, path, io });

  assert.ok(fs.existsSync(path.join(cwd, '.n.codes')));
  assert.ok(fs.existsSync(path.join(cwd, '.n.codes', 'INSTALL.md')));
});

test('runInstall replaces template variables', () => {
  const cwd = createTempDir();
  writePackageJson(cwd, { vue: '^3.0.0' }, { vite: '^5.0.0' });
  writeFile(cwd, 'vite.config.ts', 'export default {}');
  const io = createMemoryIO();

  const result = runInstall({ cwd, fs, path, io });

  const content = fs.readFileSync(result.outputPath, 'utf8');
  assert.ok(!content.includes('{{'));
  assert.ok(!content.includes('}}'));
  assert.ok(content.includes('n.codes.capabilities.json'));
});

test('runInstall returns framework and output path', () => {
  const cwd = createTempDir();
  const io = createMemoryIO();

  const result = runInstall({ cwd, fs, path, io });

  assert.equal(result.framework, 'generic');
  assert.ok(result.outputPath.endsWith('INSTALL.md'));
  assert.ok(fs.existsSync(result.outputPath));
});

test('runInstall generates INSTALL.md for SvelteKit', () => {
  const cwd = createTempDir();
  writePackageJson(cwd, {}, { '@sveltejs/kit': '^2.0.0' });
  writeFile(cwd, 'svelte.config.js', 'export default {}');
  const io = createMemoryIO();

  const result = runInstall({ cwd, fs, path, io });

  assert.equal(result.framework, 'sveltekit');
  const content = fs.readFileSync(result.outputPath, 'utf8');
  assert.ok(content.includes('static/n.codes.capabilities.json'));
});

test('runInstall generates INSTALL.md for Next.js Pages Router', () => {
  const cwd = createTempDir();
  writePackageJson(cwd, { next: '^13.0.0' });
  writeFile(cwd, 'pages/_app.tsx', 'export default function App() {}');
  const io = createMemoryIO();

  const result = runInstall({ cwd, fs, path, io });

  assert.equal(result.framework, 'next-pages-router');
  const content = fs.readFileSync(result.outputPath, 'utf8');
  assert.ok(content.includes('Pages Router'));
});
