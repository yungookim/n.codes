'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { handleProxy } = require('../api/proxy');

// --- Mock helpers ---

function createMockReq(body) {
  return { body };
}

function createMockRes() {
  const res = {
    statusCode: null,
    headers: {},
    body: '',
    writeHead(status, headers) {
      res.statusCode = status;
      Object.assign(res.headers, headers);
    },
    end(data) {
      if (data) res.body = data;
    }
  };
  return res;
}

// --- handleProxy validation ---

describe('handleProxy validation', () => {
  it('returns 400 when ref is missing', async () => {
    const req = createMockReq({ type: 'query' });
    const res = createMockRes();
    await handleProxy(req, res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.includes('Missing required fields'));
  });

  it('returns 400 when type is missing', async () => {
    const req = createMockReq({ ref: 'listTasks' });
    const res = createMockRes();
    await handleProxy(req, res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.includes('Missing required fields'));
  });

  it('returns 400 for invalid type', async () => {
    const req = createMockReq({ ref: 'listTasks', type: 'invalid' });
    const res = createMockRes();
    await handleProxy(req, res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.includes('must be'));
  });

  it('returns 500 when APP_ORIGIN is not set', async () => {
    const origAppOrigin = process.env.APP_ORIGIN;
    delete process.env.APP_ORIGIN;

    const req = createMockReq({ ref: 'listTasks', type: 'query' });
    const res = createMockRes();
    await handleProxy(req, res);
    assert.equal(res.statusCode, 500);
    assert.ok(res.body.includes('APP_ORIGIN'));

    // Restore
    if (origAppOrigin !== undefined) {
      process.env.APP_ORIGIN = origAppOrigin;
    }
  });

  it('returns 500 when capability map is not available', async () => {
    const origAppOrigin = process.env.APP_ORIGIN;
    const origMapPath = process.env.NCODES_CAPABILITY_MAP_PATH;

    process.env.APP_ORIGIN = 'http://localhost:3000';
    process.env.NCODES_CAPABILITY_MAP_PATH = '/nonexistent/path.json';

    const req = createMockReq({ ref: 'listTasks', type: 'query' });
    const res = createMockRes();
    await handleProxy(req, res);
    assert.equal(res.statusCode, 500);
    assert.ok(res.body.includes('Capability map'));

    // Restore
    if (origAppOrigin !== undefined) {
      process.env.APP_ORIGIN = origAppOrigin;
    } else {
      delete process.env.APP_ORIGIN;
    }
    if (origMapPath !== undefined) {
      process.env.NCODES_CAPABILITY_MAP_PATH = origMapPath;
    } else {
      delete process.env.NCODES_CAPABILITY_MAP_PATH;
    }
  });

  it('returns 404 for unknown ref', async () => {
    const origAppOrigin = process.env.APP_ORIGIN;
    const origMapPath = process.env.NCODES_CAPABILITY_MAP_PATH;
    const path = require('path');

    process.env.APP_ORIGIN = 'http://localhost:3000';
    process.env.NCODES_CAPABILITY_MAP_PATH = path.resolve(
      __dirname, '..', '..', 'test-projects', 'express-tasks', 'public', 'n.codes.capabilities.json'
    );

    const req = createMockReq({ ref: 'unknownRef', type: 'query' });
    const res = createMockRes();
    await handleProxy(req, res);
    assert.equal(res.statusCode, 404);
    assert.ok(res.body.includes('Unknown query ref'));

    // Restore
    if (origAppOrigin !== undefined) {
      process.env.APP_ORIGIN = origAppOrigin;
    } else {
      delete process.env.APP_ORIGIN;
    }
    if (origMapPath !== undefined) {
      process.env.NCODES_CAPABILITY_MAP_PATH = origMapPath;
    } else {
      delete process.env.NCODES_CAPABILITY_MAP_PATH;
    }
  });
});
