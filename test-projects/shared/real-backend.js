const fs = require('node:fs');
const path = require('node:path');

const {
  handleGenerate,
  handleGetJob,
  handleStreamGenerate,
} = require('../../server/api/generate');

const repoRoot = path.resolve(__dirname, '..', '..');
let envLoaded = false;

function parseEnvValue(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      return trimmed.slice(1, -1);
    }
  }
  const commentIndex = trimmed.indexOf(' #');
  if (commentIndex !== -1) {
    return trimmed.substring(0, commentIndex).trimEnd();
  }
  return trimmed;
}

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const pattern = /^\s*(export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;

  for (const line of lines) {
    if (!line || !line.trim() || line.trim().startsWith('#')) continue;
    const match = line.match(pattern);
    if (!match) continue;
    const key = match[2];
    const value = parseEnvValue(match[3] || '');
    if (!key) continue;
    if (process.env[key] == null || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

function loadEnvFileIfNeeded() {
  if (envLoaded) return;
  envLoaded = true;

  const envPath = path.join(repoRoot, '.env.local');
  loadEnvFile(envPath);
}

function configureProjectEnv(projectRoot) {
  loadEnvFileIfNeeded();
  loadEnvFile(path.join(projectRoot, '.env.local'));

  if (!process.env.CAPABILITY_MAP_PATH && !process.env.NCODES_CAPABILITY_MAP_PATH) {
    const rootMap = path.join(projectRoot, 'n.codes.capabilities.json');
    const publicMap = path.join(projectRoot, 'public', 'n.codes.capabilities.json');
    if (fs.existsSync(rootMap)) {
      process.env.CAPABILITY_MAP_PATH = rootMap;
    } else if (fs.existsSync(publicMap)) {
      process.env.CAPABILITY_MAP_PATH = publicMap;
    }
  }
}

function createResponseCapture() {
  let statusCode = 200;
  const headers = {};
  let body = '';
  let resolve;

  const done = new Promise((doneResolve) => {
    resolve = doneResolve;
  });

  const res = {
    writeHead(code, headerObj) {
      statusCode = code;
      if (headerObj) Object.assign(headers, headerObj);
    },
    setHeader(name, value) {
      headers[name] = value;
    },
    getHeader(name) {
      return headers[name];
    },
    write(chunk) {
      body += chunk;
    },
    end(chunk) {
      if (chunk) body += chunk;
      resolve({ status: statusCode, headers, body });
    },
  };

  return { res, done };
}

function createStreamAdapter() {
  const TransformStreamImpl = globalThis.TransformStream || require('node:stream/web').TransformStream;
  const { readable, writable } = new TransformStreamImpl();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  let statusCode = 200;
  const headers = {};
  let resolved = false;
  let resolveHeaders;
  const headersReady = new Promise((resolve) => {
    resolveHeaders = resolve;
  });

  const res = {
    writeHead(code, headerObj) {
      statusCode = code;
      if (headerObj) Object.assign(headers, headerObj);
      if (!resolved) {
        resolved = true;
        resolveHeaders();
      }
    },
    setHeader(name, value) {
      headers[name] = value;
    },
    getHeader(name) {
      return headers[name];
    },
    write(chunk) {
      const payload = typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
      writer.write(encoder.encode(payload));
    },
    end(chunk) {
      if (chunk) {
        const payload = typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
        writer.write(encoder.encode(payload));
      }
      if (!resolved) {
        resolved = true;
        resolveHeaders();
      }
      writer.close();
    },
  };

  return { res, readable, headersReady, getStatus: () => statusCode, getHeaders: () => headers };
}

async function runNodeHandler(handler, { body, params }) {
  const { res, done } = createResponseCapture();
  const req = { body: body || {}, params: params || {} };

  try {
    await handler(req, res);
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
  }

  return done;
}

function handleGenerateForProject(projectRoot, req, res) {
  configureProjectEnv(projectRoot);
  return handleGenerate(req, res);
}

function handleGetJobForProject(projectRoot, req, res) {
  configureProjectEnv(projectRoot);
  return handleGetJob(req, res);
}

function handleStreamGenerateForProject(projectRoot, req, res) {
  configureProjectEnv(projectRoot);
  return handleStreamGenerate(req, res);
}

async function runNodeHandlerForProject(projectRoot, handler, payload) {
  configureProjectEnv(projectRoot);
  return runNodeHandler(handler, payload);
}

async function runStreamHandlerForProject(projectRoot, handler, payload) {
  configureProjectEnv(projectRoot);

  const { res, readable, headersReady, getStatus, getHeaders } = createStreamAdapter();
  const req = { body: payload?.body || {}, params: payload?.params || {} };

  handler(req, res).catch((error) => {
    const message = error && error.message ? error.message : String(error);
    if (!getHeaders()['Content-Type']) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ error: message }));
  });

  await headersReady;

  return { status: getStatus(), headers: getHeaders(), body: readable };
}

module.exports = {
  handlers: {
    handleGenerate,
    handleGetJob,
    handleStreamGenerate,
  },
  configureProjectEnv,
  handleGenerateForProject,
  handleGetJobForProject,
  handleStreamGenerateForProject,
  runNodeHandlerForProject,
  runStreamHandlerForProject,
};
