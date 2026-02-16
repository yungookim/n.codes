'use strict';

const crypto = require('crypto');

const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const DEFAULT_LEVEL = String(process.env.NCODES_LOG_LEVEL || process.env.LOG_LEVEL || 'info').toLowerCase();

function isLevelEnabled(level) {
  const desired = LEVELS[DEFAULT_LEVEL] ?? LEVELS.info;
  const current = LEVELS[level] ?? LEVELS.info;
  return current >= desired;
}

function formatTimestamp(date = new Date()) {
  // Example: 2026-02-16 14:23:01.123
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

function truncate(text, max = 200) {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3))}...`;
}

function normalizeWhitespace(text) {
  return String(text).replace(/\s+/g, ' ').trim();
}

function stringifyValue(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') {
    return `"${truncate(normalizeWhitespace(value), 160)}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return truncate(JSON.stringify(value), 200);
  } catch {
    return String(value);
  }
}

function formatMeta(meta) {
  if (!meta || Object.keys(meta).length === 0) return '';
  const pairs = Object.entries(meta)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${stringifyValue(value)}`);
  return pairs.length ? ` | ${pairs.join(' ')}` : '';
}

function formatContext(context) {
  if (!context) return '';
  const tags = [];
  if (context.requestId) tags.push(`req:${context.requestId}`);
  if (context.jobId) tags.push(`job:${context.jobId}`);
  return tags.length ? ` [${tags.join(' ')}]` : '';
}

function logLine(level, message, meta, context) {
  const label = level.toUpperCase().padEnd(5);
  const timestamp = formatTimestamp();
  const contextLabel = formatContext(context);
  const metaLabel = formatMeta(meta);
  return `[n.codes ${timestamp}] ${label}${contextLabel} ${message}${metaLabel}`;
}

function baseLog(level, message, meta, context) {
  if (!isLevelEnabled(level)) return;
  const line = logLine(level, message, meta, context);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

function createLogger(context = {}) {
  return {
    debug(message, meta) {
      baseLog('debug', message, meta, context);
    },
    info(message, meta) {
      baseLog('info', message, meta, context);
    },
    warn(message, meta) {
      baseLog('warn', message, meta, context);
    },
    error(message, meta) {
      baseLog('error', message, meta, context);
    },
  };
}

function summarizeText(text, maxLen = 160) {
  if (!text) return '';
  return truncate(normalizeWhitespace(text), maxLen);
}

function errorMeta(error) {
  if (!error) return {};
  const meta = {
    error: error.message || String(error),
    type: error.name || undefined,
    code: error.code || undefined,
  };
  if (error.stack) {
    const lines = String(error.stack).split('\n').slice(0, 4).map((line) => line.trim());
    meta.stack = lines.join(' | ');
  }
  return meta;
}

function requestLogger(req, res, next) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const log = createLogger({ requestId });
  const startedAt = Date.now();

  req.requestId = requestId;
  req.log = log;

  log.info(`${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    log.info('Response', { status: res.statusCode, durationMs: Date.now() - startedAt });
  });

  res.on('close', () => {
    if (!res.writableEnded) {
      log.warn('Connection closed early', { durationMs: Date.now() - startedAt });
    }
  });

  next();
}

const logger = createLogger();

module.exports = {
  logger,
  createLogger,
  requestLogger,
  summarizeText,
  errorMeta,
};
