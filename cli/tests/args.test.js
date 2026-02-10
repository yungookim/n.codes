const test = require('node:test');
const assert = require('node:assert/strict');

const { COMMANDS, normalizeCommand, parseArgs } = require('../lib/args');

test('normalizeCommand recognizes known commands', () => {
  COMMANDS.forEach((command) => {
    assert.equal(normalizeCommand(command), command);
    assert.equal(normalizeCommand(command.toUpperCase()), command);
  });
  assert.equal(normalizeCommand('help'), 'help');
  assert.equal(normalizeCommand('unknown'), null);
});

test('parseArgs returns flags and positionals', () => {
  const result = parseArgs(['init', '--dry-run', '--config', 'custom.json', '-h']);
  assert.equal(result.command, 'init');
  assert.equal(result.flags.dryRun, true);
  assert.equal(result.flags.configPath, 'custom.json');
  assert.equal(result.flags.help, true);
  assert.equal(result.unknown.length, 0);
});

test('parseArgs captures unknown flags', () => {
  const result = parseArgs(['sync', '--nope']);
  assert.equal(result.command, 'sync');
  assert.deepEqual(result.unknown, ['--nope']);
});

test('parseArgs preserves unknown command for error handling', () => {
  const result = parseArgs(['whoops']);
  assert.equal(result.command, 'whoops');
  assert.equal(result.unknown.length, 0);
});

test('parseArgs marks --config without value as unknown', () => {
  const result = parseArgs(['init', '--config', '--dry-run']);
  assert.equal(result.command, 'init');
  assert.ok(result.unknown.includes('--config'));
});

test('parseArgs recognizes --force flag', () => {
  const result = parseArgs(['sync', '--force']);
  assert.equal(result.command, 'sync');
  assert.equal(result.flags.force, true);
});

test('parseArgs recognizes -f shorthand for force', () => {
  const result = parseArgs(['sync', '-f']);
  assert.equal(result.command, 'sync');
  assert.equal(result.flags.force, true);
});

test('parseArgs parses sample size', () => {
  const result = parseArgs(['sync', '--sample', '5']);
  assert.equal(result.command, 'sync');
  assert.equal(result.flags.sample, 5);
});

test('parseArgs recognizes --all flag', () => {
  const result = parseArgs(['reset', '--all']);
  assert.equal(result.command, 'reset');
  assert.equal(result.flags.all, true);
});

test('parseArgs recognizes --provider flag', () => {
  const result = parseArgs(['init', '--provider', 'openai']);
  assert.equal(result.command, 'init');
  assert.equal(result.flags.provider, 'openai');
});

test('parseArgs recognizes --model flag', () => {
  const result = parseArgs(['init', '--model', 'gpt-5-mini']);
  assert.equal(result.command, 'init');
  assert.equal(result.flags.model, 'gpt-5-mini');
});

test('parseArgs recognizes --auto flag', () => {
  const result = parseArgs(['init', '--auto']);
  assert.equal(result.command, 'init');
  assert.equal(result.flags.auto, true);
});

test('parseArgs marks --provider without value as unknown', () => {
  const result = parseArgs(['init', '--provider', '--dry-run']);
  assert.ok(result.unknown.includes('--provider'));
  assert.equal(result.flags.provider, null);
});

test('parseArgs marks --model without value as unknown', () => {
  const result = parseArgs(['init', '--model']);
  assert.ok(result.unknown.includes('--model'));
  assert.equal(result.flags.model, null);
});

test('normalizeCommand recognizes verify', () => {
  assert.equal(normalizeCommand('verify'), 'verify');
  assert.equal(normalizeCommand('VERIFY'), 'verify');
});
