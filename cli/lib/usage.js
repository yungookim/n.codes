const { COMMANDS } = require('./args');

function formatUsage() {
  const commandList = Array.from(COMMANDS).join(', ');
  return [
    'ncodes - capability map CLI',
    '',
    'Usage:',
    '  npx ncodes <command> [options]',
    '',
    'Commands:',
    `  ${commandList}`,
    '',
    'Options:',
    '  --config <path>       Path to n.codes.config.json',
    '  --dry-run             Skip writing files',
    '  -f, --force           Re-analyze routes, ignoring cache',
    '  -s, --sample <n>      Analyze only N routes with LLM (sync only)',
    '  -a, --all             Delete all n.codes files in the current directory (reset only)',
    '  --provider <name>     LLM provider: openai or claude (init only)',
    '  --model <name>        LLM model name (init only)',
    '  --auto                Auto-detect provider from environment (init only)',
    '  -h, --help            Show help',
    '  -v, --version         Show version',
    '',
    'Agent mode:',
    '  npx ncodes init --auto                  Auto-detect provider from API key env var',
    '  npx ncodes init --provider openai       Set provider explicitly',
    '  npx ncodes init --provider claude --model claude-opus-4-5',
    '  npx ncodes verify                       Check full installation status',
  ].join('\n');
}

module.exports = { formatUsage };
