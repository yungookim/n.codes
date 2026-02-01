#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const { parseArgs } = require('./lib/args');
const { formatUsage } = require('./lib/usage');
const { VERSION } = require('./lib/version');
const { createNodeIO } = require('./lib/io');
const { createDryRunFs } = require('./lib/fs-utils');
const { runInit, ensureApiKey } = require('./lib/init');
const { runDev } = require('./lib/dev');
const { runSync } = require('./lib/sync');
const { runValidate } = require('./lib/validate');
const { loadConfig } = require('./lib/config');

async function dispatchCommand(command, { cwd, fs: activeFs, path, io, configPath, force = false }) {
  if (command !== 'init' && ['dev', 'sync', 'validate'].includes(command)) {
    let ranInit = false;
    let { config, exists } = loadConfig({ cwd, fs: activeFs, path, configPath });
    if (!exists) {
      io.log('No config found. Running init first.');
      const result = await runInit({ cwd, fs: activeFs, path, io, configPath });
      config = result.config;
      exists = true;
      ranInit = true;
    }
    if (!ranInit && exists && config?.provider) {
      await ensureApiKey({ cwd, fs: activeFs, path, io, provider: config.provider });
    }
  }
  if (command === 'init') {
    await runInit({ cwd, fs: activeFs, path, io, configPath });
    return 0;
  }
  if (command === 'dev') {
    runDev({ cwd, fs: activeFs, path, io, configPath });
    return 0;
  }
  if (command === 'sync') {
    runSync({ cwd, fs: activeFs, path, io, configPath, force });
    return 0;
  }
  if (command === 'validate') {
    const { result } = runValidate({ cwd, fs: activeFs, path, io, configPath });
    return result.valid ? 0 : 1;
  }
  io.error(`Unknown command: ${command}`);
  io.log(formatUsage());
  return 1;
}

async function main(argv, { cwd = process.cwd(), io = createNodeIO(), configPath = null } = {}) {
  const parsed = parseArgs(argv);

  if (parsed.flags.version) {
    io.log(VERSION);
    return 0;
  }

  if (parsed.flags.help || parsed.command === 'help' || !parsed.command) {
    io.log(formatUsage());
    return 0;
  }

  if (parsed.unknown.length) {
    io.error(`Unknown options: ${parsed.unknown.join(', ')}`);
    io.log(formatUsage());
    return 1;
  }

  const activeFs = parsed.flags.dryRun ? createDryRunFs(fs, io) : fs;

  try {
    return await dispatchCommand(parsed.command, {
      cwd,
      fs: activeFs,
      path,
      io,
      configPath: parsed.flags.configPath || configPath,
      force: parsed.flags.force,
    });
  } catch (error) {
    io.error(error.message || 'Command failed.');
    return 1;
  } finally {
    if (io.close) io.close();
  }
}

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}

module.exports = {
  dispatchCommand,
  main,
};
