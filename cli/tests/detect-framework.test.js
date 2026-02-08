const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { detectFramework, readDependencies, FRAMEWORKS } = require('../lib/detect-framework');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ncodes-detect-'));
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

test('FRAMEWORKS contains expected framework IDs', () => {
  assert.ok(FRAMEWORKS.includes('next-app-router'));
  assert.ok(FRAMEWORKS.includes('next-pages-router'));
  assert.ok(FRAMEWORKS.includes('sveltekit'));
  assert.ok(FRAMEWORKS.includes('vue-vite'));
  assert.ok(FRAMEWORKS.includes('express'));
  assert.ok(FRAMEWORKS.includes('generic'));
});

test('detectFramework returns next-app-router for Next.js with app/layout.tsx', () => {
  const cwd = createTempDir();
  writePackageJson(cwd, { next: '^14.0.0', react: '^18.0.0' });
  writeFile(cwd, 'app/layout.tsx', 'export default function Layout() {}');
  assert.equal(detectFramework({ cwd, fs, path }), 'next-app-router');
});

test('detectFramework returns next-app-router for src/app/layout.tsx', () => {
  const cwd = createTempDir();
  writePackageJson(cwd, { next: '^14.0.0' });
  writeFile(cwd, 'src/app/layout.tsx', 'export default function Layout() {}');
  assert.equal(detectFramework({ cwd, fs, path }), 'next-app-router');
});

test('detectFramework returns next-pages-router for pages/_app.tsx', () => {
  const cwd = createTempDir();
  writePackageJson(cwd, { next: '^13.0.0', react: '^18.0.0' });
  writeFile(cwd, 'pages/_app.tsx', 'export default function App() {}');
  assert.equal(detectFramework({ cwd, fs, path }), 'next-pages-router');
});

test('detectFramework prefers app router over pages router', () => {
  const cwd = createTempDir();
  writePackageJson(cwd, { next: '^14.0.0' });
  writeFile(cwd, 'app/layout.tsx', 'export default function Layout() {}');
  writeFile(cwd, 'pages/_app.tsx', 'export default function App() {}');
  assert.equal(detectFramework({ cwd, fs, path }), 'next-app-router');
});

test('detectFramework defaults to next-app-router when next is in deps but no layout/app file', () => {
  const cwd = createTempDir();
  writePackageJson(cwd, { next: '^14.0.0' });
  assert.equal(detectFramework({ cwd, fs, path }), 'next-app-router');
});

test('detectFramework returns sveltekit', () => {
  const cwd = createTempDir();
  writePackageJson(cwd, {}, { '@sveltejs/kit': '^2.0.0' });
  writeFile(cwd, 'svelte.config.js', 'export default {}');
  assert.equal(detectFramework({ cwd, fs, path }), 'sveltekit');
});

test('detectFramework returns vue-vite', () => {
  const cwd = createTempDir();
  writePackageJson(cwd, { vue: '^3.0.0' }, { vite: '^5.0.0' });
  writeFile(cwd, 'vite.config.ts', 'export default {}');
  assert.equal(detectFramework({ cwd, fs, path }), 'vue-vite');
});

test('detectFramework returns express', () => {
  const cwd = createTempDir();
  writePackageJson(cwd, { express: '^4.18.0' });
  assert.equal(detectFramework({ cwd, fs, path }), 'express');
});

test('detectFramework returns generic when no framework detected', () => {
  const cwd = createTempDir();
  writePackageJson(cwd, { lodash: '^4.0.0' });
  assert.equal(detectFramework({ cwd, fs, path }), 'generic');
});

test('detectFramework returns generic when no package.json', () => {
  const cwd = createTempDir();
  assert.equal(detectFramework({ cwd, fs, path }), 'generic');
});

test('readDependencies returns combined deps and devDeps', () => {
  const cwd = createTempDir();
  writePackageJson(cwd, { react: '^18.0.0' }, { typescript: '^5.0.0' });
  const deps = readDependencies({ cwd, fs, path });
  assert.ok(deps.has('react'));
  assert.ok(deps.has('typescript'));
  assert.ok(!deps.has('lodash'));
});

test('readDependencies returns empty set for missing package.json', () => {
  const cwd = createTempDir();
  const deps = readDependencies({ cwd, fs, path });
  assert.equal(deps.size, 0);
});

test('readDependencies handles invalid JSON gracefully', () => {
  const cwd = createTempDir();
  writeFile(cwd, 'package.json', 'not json');
  const deps = readDependencies({ cwd, fs, path });
  assert.equal(deps.size, 0);
});
