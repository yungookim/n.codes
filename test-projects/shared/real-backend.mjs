import { createRequire } from 'node:module';

// ESM wrapper for the CJS real-backend implementation.
const require = createRequire(import.meta.url);
const backend = require('./real-backend.js');

export default backend;
export const {
  handlers,
  configureProjectEnv,
  handleGenerateForProject,
  handleGetJobForProject,
  handleStreamGenerateForProject,
  runNodeHandlerForProject,
  runStreamHandlerForProject,
} = backend;
