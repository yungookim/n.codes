const COMMANDS = new Set(['init', 'dev', 'sync', 'validate', 'reset', 'install']);

function normalizeCommand(value) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (COMMANDS.has(normalized)) return normalized;
  if (normalized === 'help') return 'help';
  return null;
}

function parseArgs(argv) {
  const flags = {
    help: false,
    version: false,
    dryRun: false,
    force: false,
    configPath: null,
    sample: null,
    all: false,
  };
  const positionals = [];
  const unknown = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      flags.help = true;
      continue;
    }
    if (arg === '--version' || arg === '-v') {
      flags.version = true;
      continue;
    }
    if (arg === '--dry-run') {
      flags.dryRun = true;
      continue;
    }
    if (arg === '--force' || arg === '-f') {
      flags.force = true;
      continue;
    }
    if (arg === '--sample' || arg === '-s') {
      const next = argv[i + 1];
      if (!next || next.startsWith('-')) {
        unknown.push(arg);
      } else {
        const parsed = Number.parseInt(next, 10);
        if (Number.isNaN(parsed) || parsed <= 0) {
          unknown.push(arg);
        } else {
          flags.sample = parsed;
          i += 1;
        }
      }
      continue;
    }
    if (arg === '--all' || arg === '-a') {
      flags.all = true;
      continue;
    }
    if (arg === '--config') {
      const next = argv[i + 1];
      if (!next || next.startsWith('-')) {
        unknown.push(arg);
      } else {
        flags.configPath = next;
        i += 1;
      }
      continue;
    }
    if (arg.startsWith('-')) {
      unknown.push(arg);
      continue;
    }
    positionals.push(arg);
  }

  const normalizedCommand = normalizeCommand(positionals[0]);
  const command = normalizedCommand ?? (positionals[0] ? String(positionals[0]).trim() : null);

  return {
    command,
    flags,
    positionals,
    unknown,
  };
}

module.exports = {
  COMMANDS,
  normalizeCommand,
  parseArgs,
};
