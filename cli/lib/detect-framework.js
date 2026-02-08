/**
 * Framework detection from project file structure and dependencies.
 */

const FRAMEWORKS = [
  'next-app-router',
  'next-pages-router',
  'sveltekit',
  'vue-vite',
  'express',
  'generic',
];

function detectFramework({ cwd, fs, path }) {
  const deps = readDependencies({ cwd, fs, path });
  const exists = (relativePath) => fs.existsSync(path.join(cwd, relativePath));

  // Next.js App Router: app/layout.{tsx,jsx,js} + next in deps
  if (deps.has('next')) {
    const hasAppLayout = exists('app/layout.tsx') || exists('app/layout.jsx') || exists('app/layout.js') ||
                         exists('src/app/layout.tsx') || exists('src/app/layout.jsx') || exists('src/app/layout.js');
    if (hasAppLayout) return 'next-app-router';

    // Next.js Pages Router: pages/_app.{tsx,jsx,js} + next in deps
    const hasPagesApp = exists('pages/_app.tsx') || exists('pages/_app.jsx') || exists('pages/_app.js') ||
                        exists('src/pages/_app.tsx') || exists('src/pages/_app.jsx') || exists('src/pages/_app.js');
    if (hasPagesApp) return 'next-pages-router';

    // Default to App Router for Next.js projects without clear signals
    return 'next-app-router';
  }

  // SvelteKit: svelte.config.js + @sveltejs/kit in deps
  if (deps.has('@sveltejs/kit') && (exists('svelte.config.js') || exists('svelte.config.ts'))) {
    return 'sveltekit';
  }

  // Vue + Vite: vite.config.{ts,js} + vue in deps
  if (deps.has('vue') && (exists('vite.config.ts') || exists('vite.config.js'))) {
    return 'vue-vite';
  }

  // Express: express in deps
  if (deps.has('express')) {
    return 'express';
  }

  return 'generic';
}

function readDependencies({ cwd, fs, path }) {
  const pkgPath = path.join(cwd, 'package.json');
  const deps = new Set();

  if (!fs.existsSync(pkgPath)) return deps;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };
    Object.keys(allDeps).forEach((dep) => deps.add(dep));
  } catch {
    // Invalid package.json — fall through to generic
  }

  return deps;
}

module.exports = { detectFramework, readDependencies, FRAMEWORKS };
