const {
  defaultConfig,
  validateProvider,
  resolveConfigPath,
  saveConfig,
} = require('./config');

function getInitQuestions() {
  return [
    {
      key: 'provider',
      prompt: 'Select LLM provider (openai, claude, grok, gemini)',
      defaultValue: 'openai',
    },
    {
      key: 'model',
      prompt: 'Default model name',
      defaultValue: 'default',
    },
    {
      key: 'projectName',
      prompt: 'Project name (optional)',
      defaultValue: '',
    },
  ];
}

function normalizeAnswer(value, fallback) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return fallback;
  return trimmed;
}

async function runInit({ cwd, fs, path, io, configPath }) {
  const answers = {};
  const questions = getInitQuestions();

  for (const question of questions) {
    const response = await io.prompt(`${question.prompt} [${question.defaultValue}] `);
    answers[question.key] = normalizeAnswer(response, question.defaultValue);
  }

  const providerCheck = validateProvider(answers.provider);
  if (!providerCheck.valid) {
    io.error(providerCheck.error);
    throw new Error(providerCheck.error);
  }

  const config = {
    ...defaultConfig(),
    provider: providerCheck.provider,
    model: answers.model,
    projectName: answers.projectName || null,
  };

  const targetPath = configPath || resolveConfigPath({ cwd, path });
  saveConfig({ cwd, fs, path, config, configPath: targetPath });
  io.log(`Saved config to ${targetPath}`);

  return { config, path: targetPath };
}

module.exports = {
  getInitQuestions,
  normalizeAnswer,
  runInit,
};
