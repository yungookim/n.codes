function parseImports(content) {
  const imports = [];
  const importRegex = /import\s+(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))?\s*from\s+['"]([^'"]+)['"]/g;
  const typeImportRegex = /import\s+type\s+/;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const specifier = match[1];
    const isTypeOnly = typeImportRegex.test(fullMatch);
    imports.push({ specifier, isTypeOnly });
  }

  return imports;
}

function loadTsConfigPaths({ cwd, fs, path }) {
  const tsconfigPath = path.join(cwd, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    return {};
  }
  try {
    const content = fs.readFileSync(tsconfigPath, 'utf8');
    const config = JSON.parse(content);
    return config?.compilerOptions?.paths || {};
  } catch {
    return {};
  }
}

function resolveImportPath(specifier, { cwd, fromFile, paths, path }) {
  // Skip node_modules packages
  if (!specifier.startsWith('.') && !specifier.startsWith('@/') && !specifier.startsWith('~/')) {
    // Check if it's an aliased path
    const matchedAlias = Object.keys(paths).find((alias) => {
      const pattern = alias.replace('/*', '');
      return specifier.startsWith(pattern);
    });
    if (!matchedAlias) {
      return null; // node_modules package
    }
  }

  // Resolve alias
  for (const [alias, targets] of Object.entries(paths)) {
    const pattern = alias.replace('/*', '');
    if (specifier.startsWith(pattern)) {
      const suffix = specifier.slice(pattern.length);
      const target = targets[0].replace('/*', '');
      return target + suffix;
    }
  }

  // Resolve relative path
  if (specifier.startsWith('.')) {
    const fromDir = path.dirname(fromFile);
    const resolved = path.normalize(path.join(fromDir, specifier));
    return resolved;
  }

  return null;
}

const MAX_CONTENT_LENGTH = 32000; // ~8K tokens

function buildRouteContext({ cwd, routeFile, fs, path }) {
  const paths = loadTsConfigPaths({ cwd, fs, path });
  const routeFullPath = path.join(cwd, routeFile);
  const routeContent = fs.readFileSync(routeFullPath, 'utf8');

  const parsedImports = parseImports(routeContent);
  const imports = [];
  const typeImports = [];

  for (const imp of parsedImports) {
    const resolved = resolveImportPath(imp.specifier, {
      cwd,
      fromFile: routeFile,
      paths,
      path
    });

    if (!resolved) continue;

    if (imp.isTypeOnly) {
      // Extract type names from import
      const escapedSpecifier = imp.specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const typeMatch = routeContent.match(
        new RegExp(`import\\s+type\\s+\\{([^}]+)\\}\\s+from\\s+['"]${escapedSpecifier}['"]`)
      );
      if (typeMatch) {
        const types = typeMatch[1].split(',').map((t) => t.trim());
        typeImports.push(...types);
      }
      continue;
    }

    // Try to find and read the file
    const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
    let content = null;
    let resolvedPath = null;

    for (const ext of extensions) {
      const tryPath = path.join(cwd, resolved + ext);
      if (fs.existsSync(tryPath)) {
        content = fs.readFileSync(tryPath, 'utf8');
        resolvedPath = resolved + ext;
        break;
      }
      // Try index file
      const indexPath = path.join(cwd, resolved, `index${ext || '.ts'}`);
      if (fs.existsSync(indexPath)) {
        content = fs.readFileSync(indexPath, 'utf8');
        resolvedPath = path.join(resolved, `index${ext || '.ts'}`);
        break;
      }
    }

    if (content && resolvedPath) {
      imports.push({
        path: resolvedPath,
        content: content.slice(0, MAX_CONTENT_LENGTH),
        isTypeOnly: false
      });
    }
  }

  // Truncate total content if needed
  let totalLength = routeContent.length;
  const truncatedImports = imports.map((imp) => {
    if (totalLength + imp.content.length > MAX_CONTENT_LENGTH) {
      const available = Math.max(0, MAX_CONTENT_LENGTH - totalLength);
      totalLength += available;
      return { ...imp, content: imp.content.slice(0, available) };
    }
    totalLength += imp.content.length;
    return imp;
  });

  return {
    routeFile,
    routeContent,
    imports: truncatedImports,
    typeImports
  };
}

module.exports = {
  parseImports,
  loadTsConfigPaths,
  resolveImportPath,
  buildRouteContext
};
