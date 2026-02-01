const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const root = process.cwd();
const cliPath = path.join(root, 'cli', 'bin.js');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, contents) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents, 'utf8');
}

function runCli(command, cwd, input) {
  const result = spawnSync('node', [cliPath, command], {
    cwd,
    input,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  if (result.status !== 0) {
    throw new Error(`CLI command failed: ${command}`);
  }
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ncodes-user-'));

writeFile(path.join(tempDir, 'src', 'api', 'orders', '_get.js'), 'export function GET() {}\n');
writeFile(path.join(tempDir, 'src', 'api', 'orders', '_post.js'), 'export function POST() {}\n');

const firstRunInput = ['openai', 'gpt-4o', 'Sample Project', 'test-key'].join('\n') + '\n';
runCli('sync', tempDir, firstRunInput);
runCli('dev', tempDir, '\n');

console.log(`Simulated user project: ${tempDir}`);
console.log('Generated files:');
console.log(`- ${path.join(tempDir, 'n.codes.config.json')}`);
console.log(`- ${path.join(tempDir, '.env.local')}`);
console.log(`- ${path.join(tempDir, 'n.codes.capabilities.yaml')}`);
