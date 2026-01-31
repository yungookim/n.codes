const { COMMANDS } = require('./args');

function formatUsage() {
  const commandList = Array.from(COMMANDS).join(', ');
  return [
    'n.codes - capability map CLI prototype',
    '',
    'Usage:',
    '  npx n.codes <command> [options]',
    '',
    'Commands:',
    `  ${commandList}`,
    '',
    'Options:',
    '  --config <path>   Path to n.codes.config.json',
    '  --dry-run         Skip writing files',
    '  -h, --help        Show help',
    '  -v, --version     Show version',
  ].join('\n');
}

module.exports = { formatUsage };
