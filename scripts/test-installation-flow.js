#!/usr/bin/env node

/**
 * Integration test script for the n.codes installation flow.
 *
 * For each test project:
 * 1. Runs `n.codes install` to generate .n.codes/INSTALL.md
 * 2. Validates the generated files contain correct framework, paths, and code
 *
 * Usage: node scripts/test-installation-flow.js
 *
 * Note: AI-driven install (giving INSTALL.md to Claude Code) is manual for now.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CLI_BIN = path.join(ROOT, 'cli', 'bin.js');

const TEST_PROJECTS = [
  {
    name: 'next-app-crm',
    expectedFramework: 'next-app-router',
  },
  {
    name: 'next-pages-invoices',
    expectedFramework: 'next-pages-router',
  },
  {
    name: 'express-tasks',
    expectedFramework: 'express',
  },
  {
    name: 'vue-dashboard',
    expectedFramework: 'vue-vite',
  },
  {
    name: 'sveltekit-tickets',
    expectedFramework: 'sveltekit',
  },
];

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  \u2713 ${label}`);
    passed++;
  } else {
    console.log(`  \u2717 ${label}`);
    failed++;
  }
}

function testProject(project) {
  const projectDir = path.join(ROOT, 'test-projects', project.name);

  console.log(`\n--- ${project.name} ---`);

  // Check project exists
  if (!fs.existsSync(projectDir)) {
    console.log(`  \u2717 Project directory exists`);
    failed++;
    return;
  }
  check('Project directory exists', true);

  // Check package.json exists
  const pkgPath = path.join(projectDir, 'package.json');
  check('package.json exists', fs.existsSync(pkgPath));

  // Run n.codes install (uses execFileSync — no shell injection risk)
  try {
    execFileSync(process.execPath, [CLI_BIN, 'install'], {
      cwd: projectDir,
      stdio: 'pipe',
      timeout: 30000,
    });
    check('n.codes install succeeds', true);
  } catch (err) {
    check('n.codes install succeeds', false);
    const stderr = err.stderr ? err.stderr.toString().trim() : err.message;
    console.log(`    Error: ${stderr}`);
  }

  // Validate INSTALL.md
  const installPath = path.join(projectDir, '.n.codes', 'INSTALL.md');
  check('INSTALL.md generated', fs.existsSync(installPath));

  if (fs.existsSync(installPath)) {
    const content = fs.readFileSync(installPath, 'utf8');

    // Check framework detection
    check(
      `Framework detected as ${project.expectedFramework}`,
      content.includes(`framework: ${project.expectedFramework}`)
    );

    // Check template variables are replaced (match {{word}} pattern, not JSX object literals)
    check('No unreplaced template variables', !/\{\{[a-zA-Z]/.test(content));

    // Check essential content
    check('Contains install step', content.includes('npm install'));
    check('Contains widget package reference', content.includes('@ncodes/widget'));
    check('Contains verification section', content.includes('Verification') || content.includes('Verify'));
  }
}

console.log('=== n.codes Installation Flow Integration Tests ===');
console.log(`CLI: ${CLI_BIN}`);
console.log(`Test projects: ${TEST_PROJECTS.map((p) => p.name).join(', ')}`);

for (const project of TEST_PROJECTS) {
  testProject(project);
}

// Cleanup: remove generated .n.codes dirs from test projects
for (const project of TEST_PROJECTS) {
  const ncodesDir = path.join(ROOT, 'test-projects', project.name, '.n.codes');
  if (fs.existsSync(ncodesDir)) {
    fs.rmSync(ncodesDir, { recursive: true });
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
