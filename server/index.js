require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { handleGenerate, handleGetJob, handleStreamGenerate } = require('./api/generate');
const { handleProxy } = require('./api/proxy');
const { requestLogger, logger } = require('./lib/logger');
const { resolveCapabilityMapPath } = require('./lib/capability-map');

const app = express();

const originEnv = process.env.APP_ORIGIN || process.env.MAIN_APP_ORIGIN || process.env.CORS_ORIGIN;
const allowedOrigins = originEnv
  ? originEnv.split(',').map((value) => value.trim()).filter(Boolean)
  : [];

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true
}));
app.use(requestLogger);
app.use(express.json());

app.post('/api/generate', handleGenerate);
app.get('/api/jobs/:jobId', handleGetJob);
app.post('/api/generate/stream', handleStreamGenerate);
app.post('/api/proxy', handleProxy);

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  logger.info('Server listening', { url: `http://localhost:${port}` });
  logger.info('CORS origins', { origins: allowedOrigins.length ? allowedOrigins : 'any' });
  logger.info('Capability map path', { path: resolveCapabilityMapPath() });
});
