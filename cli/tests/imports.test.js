const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { createTempDir, writeFile } = require('./helpers');

const { parseImports, loadTsConfigPaths, resolveImportPath, buildRouteContext } = require('../lib/imports');

test('parseImports extracts ES module imports', () => {
  const content = `
import { prisma } from '@/lib/prisma';
import type { Booking } from '@prisma/client';
import { BookingService } from '../services/booking';
`;
  const result = parseImports(content);
  assert.equal(result.length, 3);
  assert.equal(result[0].specifier, '@/lib/prisma');
  assert.equal(result[0].isTypeOnly, false);
  assert.equal(result[1].specifier, '@prisma/client');
  assert.equal(result[1].isTypeOnly, true);
  assert.equal(result[2].specifier, '../services/booking');
});

test('loadTsConfigPaths reads path aliases from tsconfig', () => {
  const cwd = createTempDir();
  writeFile(cwd, 'tsconfig.json', JSON.stringify({
    compilerOptions: {
      baseUrl: '.',
      paths: {
        '@/*': ['src/*'],
        '~/*': ['lib/*']
      }
    }
  }));
  const result = loadTsConfigPaths({ cwd, fs, path });
  assert.deepEqual(result['@/*'], ['src/*']);
  assert.deepEqual(result['~/*'], ['lib/*']);
});

test('loadTsConfigPaths returns empty object when no tsconfig', () => {
  const cwd = createTempDir();
  const result = loadTsConfigPaths({ cwd, fs, path });
  assert.deepEqual(result, {});
});

test('resolveImportPath resolves alias paths', () => {
  const cwd = '/project';
  const paths = { '@/*': ['src/*'] };
  const result = resolveImportPath('@/lib/prisma', {
    cwd,
    fromFile: 'pages/api/test.ts',
    paths,
    path
  });
  assert.equal(result, 'src/lib/prisma');
});

test('resolveImportPath resolves relative paths', () => {
  const result = resolveImportPath('../services/booking', {
    cwd: '/project',
    fromFile: 'pages/api/test.ts',
    paths: {},
    path
  });
  assert.equal(result, 'pages/services/booking');
});

test('resolveImportPath returns null for node_modules', () => {
  const result = resolveImportPath('express', {
    cwd: '/project',
    fromFile: 'pages/api/test.ts',
    paths: {},
    path
  });
  assert.equal(result, null);
});

test('buildRouteContext combines route with resolved imports', () => {
  const cwd = createTempDir();
  writeFile(cwd, 'tsconfig.json', JSON.stringify({
    compilerOptions: { paths: { '@/*': ['src/*'] } }
  }));
  writeFile(cwd, 'pages/api/bookings.ts', `
import { prisma } from '@/lib/prisma';
export async function POST(req) { return prisma.booking.create({}); }
`);
  writeFile(cwd, 'src/lib/prisma.ts', `
export const prisma = { booking: { create: () => {} } };
`);

  const result = buildRouteContext({
    cwd,
    routeFile: 'pages/api/bookings.ts',
    fs,
    path
  });

  assert.equal(result.routeFile, 'pages/api/bookings.ts');
  assert.ok(result.routeContent.includes('prisma.booking.create'));
  assert.equal(result.imports.length, 1);
  assert.equal(result.imports[0].path, 'src/lib/prisma.ts');
  assert.ok(result.imports[0].content.includes('export const prisma'));
});

test('buildRouteContext handles type-only imports', () => {
  const cwd = createTempDir();
  writeFile(cwd, 'tsconfig.json', JSON.stringify({
    compilerOptions: { paths: {} }
  }));
  writeFile(cwd, 'pages/api/test.ts', `
import type { User } from '../types/user';
export async function GET() { return {}; }
`);
  writeFile(cwd, 'pages/types/user.ts', 'export type User = { id: string };');

  const result = buildRouteContext({
    cwd,
    routeFile: 'pages/api/test.ts',
    fs,
    path
  });

  assert.equal(result.imports.length, 0); // Type imports not included in imports array
  assert.ok(result.typeImports.includes('User'));
});

test('buildRouteContext handles index file resolution', () => {
  const cwd = createTempDir();
  writeFile(cwd, 'tsconfig.json', JSON.stringify({ compilerOptions: {} }));
  writeFile(cwd, 'pages/api/test.ts', `
import { helper } from '../utils';
export async function GET() { return helper(); }
`);
  writeFile(cwd, 'pages/utils/index.ts', 'export const helper = () => {};');

  const result = buildRouteContext({
    cwd,
    routeFile: 'pages/api/test.ts',
    fs,
    path
  });

  assert.equal(result.imports.length, 1);
  assert.ok(result.imports[0].path.includes('index.ts'));
});

test('buildRouteContext skips unresolvable imports', () => {
  const cwd = createTempDir();
  writeFile(cwd, 'pages/api/test.ts', `
import { something } from 'lodash';
export async function GET() { return {}; }
`);

  const result = buildRouteContext({
    cwd,
    routeFile: 'pages/api/test.ts',
    fs,
    path
  });

  assert.equal(result.imports.length, 0);
});
