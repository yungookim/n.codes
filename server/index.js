require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { handleGenerate, handleStreamGenerate } = require('./api/generate');

const app = express();

const originEnv = process.env.APP_ORIGIN || process.env.MAIN_APP_ORIGIN || process.env.CORS_ORIGIN;
const allowedOrigins = originEnv
  ? originEnv.split(',').map((value) => value.trim()).filter(Boolean)
  : [];

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true
}));
app.use(express.json());

app.post('/api/generate', handleGenerate);
app.post('/api/generate/stream', handleStreamGenerate);

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`n.codes server listening on http://localhost:${port}`);
});
