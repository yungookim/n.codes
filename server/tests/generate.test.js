const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const {
  handleGetJob,
  validateRequest,
  sendSSE,
  writeErrorResponse,
  MAX_PROMPT_LENGTH
} = require('../api/generate');
const { jobStore, STATUS } = require('../lib/job-store');
const { ApiKeyError, ProviderError } = require('../lib/llm-client');
const { DSLValidationError } = require('../lib/response-parser');
const { CapabilityResolutionError } = require('../lib/capability-resolver');

// --- Mock response helper ---

function createMockRes() {
  const res = {
    statusCode: null,
    headers: {},
    body: '',
    chunks: [],
    ended: false,
    writeHead(status, headers) {
      res.statusCode = status;
      Object.assign(res.headers, headers);
    },
    write(data) {
      res.chunks.push(data);
      res.body += data;
    },
    end(data) {
      if (data) {
        res.body += data;
        res.chunks.push(data);
      }
      res.ended = true;
    }
  };
  return res;
}

// --- MAX_PROMPT_LENGTH ---

describe('MAX_PROMPT_LENGTH', () => {
  it('is 2000', () => {
    assert.equal(MAX_PROMPT_LENGTH, 2000);
  });
});

// --- validateRequest ---

describe('validateRequest', () => {
  it('returns parsed params for valid request', () => {
    const req = { body: { prompt: 'show tasks', provider: 'openai', model: 'gpt-5-mini' } };
    const res = createMockRes();
    const result = validateRequest(req, res);
    assert.ok(result);
    assert.equal(result.prompt, 'show tasks');
    assert.equal(result.provider, 'openai');
    assert.equal(result.model, 'gpt-5-mini');
  });

  it('returns null and sends 400 when prompt is missing', () => {
    const req = { body: { provider: 'openai', model: 'gpt-5-mini' } };
    const res = createMockRes();
    const result = validateRequest(req, res);
    assert.equal(result, null);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.includes('Missing required fields'));
  });

  it('returns null and sends 400 when provider is missing', () => {
    const req = { body: { prompt: 'test', model: 'gpt-5-mini' } };
    const res = createMockRes();
    const result = validateRequest(req, res);
    assert.equal(result, null);
    assert.equal(res.statusCode, 400);
  });

  it('returns null and sends 400 when model is missing', () => {
    const req = { body: { prompt: 'test', provider: 'openai' } };
    const res = createMockRes();
    const result = validateRequest(req, res);
    assert.equal(result, null);
    assert.equal(res.statusCode, 400);
  });

  it('returns null and sends 400 when prompt exceeds max length', () => {
    const req = { body: { prompt: 'x'.repeat(2001), provider: 'openai', model: 'gpt-5-mini' } };
    const res = createMockRes();
    const result = validateRequest(req, res);
    assert.equal(result, null);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.includes('maximum length'));
  });

  it('accepts prompt at exactly max length', () => {
    const req = { body: { prompt: 'x'.repeat(2000), provider: 'openai', model: 'gpt-5-mini' } };
    const res = createMockRes();
    const result = validateRequest(req, res);
    assert.ok(result);
  });

  it('includes options when provided', () => {
    const req = {
      body: {
        prompt: 'test',
        provider: 'openai',
        model: 'gpt-5-mini',
        options: { maxTokens: 1024 }
      }
    };
    const res = createMockRes();
    const result = validateRequest(req, res);
    assert.equal(result.options.maxTokens, 1024);
  });

  it('defaults options to empty object', () => {
    const req = { body: { prompt: 'test', provider: 'openai', model: 'gpt-5-mini' } };
    const res = createMockRes();
    const result = validateRequest(req, res);
    assert.deepEqual(result.options, {});
  });
});

// --- sendSSE ---

describe('sendSSE', () => {
  it('writes SSE formatted event with chunk type', () => {
    const res = createMockRes();
    sendSSE(res, 'chunk', { text: 'hello' });
    assert.equal(res.body, 'event: chunk\ndata: {"text":"hello"}\n\n');
  });

  it('writes SSE formatted event with done type', () => {
    const res = createMockRes();
    sendSSE(res, 'done', { dsl: { type: 'page' } });
    assert.ok(res.body.startsWith('event: done\n'));
    assert.ok(res.body.includes('"type":"page"'));
  });

  it('writes SSE formatted event with error type', () => {
    const res = createMockRes();
    sendSSE(res, 'error', { error: 'bad things' });
    assert.ok(res.body.startsWith('event: error\n'));
    assert.ok(res.body.includes('bad things'));
  });

  it('produces valid SSE format with double newline terminator', () => {
    const res = createMockRes();
    sendSSE(res, 'test', { key: 'value' });
    assert.ok(res.body.endsWith('\n\n'));
  });

  it('serializes complex data to JSON', () => {
    const res = createMockRes();
    sendSSE(res, 'done', {
      dsl: { type: 'page', title: 'Test', children: [] },
      reasoning: 'I chose this',
      tokensUsed: { prompt: 100, completion: 200 }
    });
    const dataLine = res.body.split('\n').find(l => l.startsWith('data: '));
    const parsed = JSON.parse(dataLine.slice(6));
    assert.equal(parsed.dsl.type, 'page');
    assert.equal(parsed.reasoning, 'I chose this');
    assert.equal(parsed.tokensUsed.prompt, 100);
  });
});

// --- writeErrorResponse ---

describe('writeErrorResponse', () => {
  it('returns 401 for ApiKeyError', () => {
    const res = createMockRes();
    writeErrorResponse(res, new ApiKeyError('OPENAI_API_KEY'));
    assert.equal(res.statusCode, 401);
    const body = JSON.parse(res.body);
    assert.ok(body.error.includes('OPENAI_API_KEY'));
  });

  it('returns 400 for ProviderError', () => {
    const res = createMockRes();
    writeErrorResponse(res, new ProviderError('bad-provider'));
    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.ok(body.error.includes('bad-provider'));
  });

  it('returns 422 for DSLValidationError with validationErrors', () => {
    const res = createMockRes();
    writeErrorResponse(res, new DSLValidationError('fail', ['err1', 'err2'], {}));
    assert.equal(res.statusCode, 422);
    const body = JSON.parse(res.body);
    assert.ok(body.error.includes('fail'));
    assert.deepEqual(body.validationErrors, ['err1', 'err2']);
  });

  it('returns 500 for generic errors', () => {
    const res = createMockRes();
    writeErrorResponse(res, new Error('something broke'));
    assert.equal(res.statusCode, 500);
    const body = JSON.parse(res.body);
    assert.equal(body.error, 'something broke');
  });

  it('does not include validationErrors for non-DSL errors', () => {
    const res = createMockRes();
    writeErrorResponse(res, new Error('generic'));
    const body = JSON.parse(res.body);
    assert.equal(body.validationErrors, undefined);
  });

  it('returns 422 for CapabilityResolutionError with resolutionErrors', () => {
    const res = createMockRes();
    const errors = [
      { path: 'root.children[0]', ref: 'badRef', type: 'query', message: 'Unknown query ref "badRef"' }
    ];
    writeErrorResponse(res, new CapabilityResolutionError('Capability resolution failed', errors));
    assert.equal(res.statusCode, 422);
    const body = JSON.parse(res.body);
    assert.ok(body.error.includes('Capability resolution failed'));
    assert.deepEqual(body.resolutionErrors, errors);
    assert.equal(body.validationErrors, undefined);
  });

  it('does not include resolutionErrors for non-resolution errors', () => {
    const res = createMockRes();
    writeErrorResponse(res, new Error('generic'));
    const body = JSON.parse(res.body);
    assert.equal(body.resolutionErrors, undefined);
  });
});

// --- SSE event format regression tests ---

describe('SSE event format', () => {
  it('chunk events have correct structure', () => {
    const res = createMockRes();
    sendSSE(res, 'chunk', { text: '{"type"' });
    const lines = res.body.split('\n');
    assert.equal(lines[0], 'event: chunk');
    assert.ok(lines[1].startsWith('data: '));
    assert.equal(lines[2], '');
    assert.equal(lines[3], '');
  });

  it('multiple chunks accumulate correctly', () => {
    const res = createMockRes();
    sendSSE(res, 'chunk', { text: '{"type":' });
    sendSSE(res, 'chunk', { text: '"page",' });
    sendSSE(res, 'chunk', { text: '"title":"T"}' });
    assert.equal(res.chunks.length, 3);
    // Each chunk is independently parseable
    for (const chunk of res.chunks) {
      const dataLine = chunk.split('\n').find(l => l.startsWith('data: '));
      assert.doesNotThrow(() => JSON.parse(dataLine.slice(6)));
    }
  });

  it('done event includes complete DSL', () => {
    const res = createMockRes();
    const dsl = { type: 'page', title: 'Test', children: [{ type: 'text', content: 'Hello' }] };
    sendSSE(res, 'done', { dsl, reasoning: '', tokensUsed: { prompt: 50, completion: 100 } });
    const dataLine = res.body.split('\n').find(l => l.startsWith('data: '));
    const parsed = JSON.parse(dataLine.slice(6));
    assert.equal(parsed.dsl.type, 'page');
    assert.equal(parsed.dsl.children[0].type, 'text');
    assert.equal(parsed.tokensUsed.completion, 100);
  });

  it('error event includes validation errors when present', () => {
    const res = createMockRes();
    sendSSE(res, 'error', { error: 'DSL validation failed', validationErrors: ['missing title'] });
    const dataLine = res.body.split('\n').find(l => l.startsWith('data: '));
    const parsed = JSON.parse(dataLine.slice(6));
    assert.deepEqual(parsed.validationErrors, ['missing title']);
  });
});

// --- handleGetJob ---

describe('handleGetJob', () => {
  afterEach(() => {
    // Clean up jobs between tests
    for (const [id] of jobStore._jobs) {
      jobStore.deleteJob(id);
    }
  });

  it('returns 404 for unknown job id', () => {
    const req = { params: { jobId: 'nonexistent' } };
    const res = createMockRes();
    handleGetJob(req, res);
    assert.equal(res.statusCode, 404);
    const body = JSON.parse(res.body);
    assert.ok(body.error.includes('not found'));
  });

  it('returns running status with step', () => {
    const job = jobStore.createJob('test', 'openai', 'gpt-5-mini');
    jobStore.updateJob(job.id, { step: 'codegen' });
    const req = { params: { jobId: job.id } };
    const res = createMockRes();
    handleGetJob(req, res);
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.status, 'running');
    assert.equal(body.step, 'codegen');
  });

  it('returns completed status with result', () => {
    const job = jobStore.createJob('test', 'openai', 'gpt-5-mini');
    const result = { html: '<h1>Hi</h1>', css: '', js: '' };
    jobStore.updateJob(job.id, { status: STATUS.COMPLETED, result });
    const req = { params: { jobId: job.id } };
    const res = createMockRes();
    handleGetJob(req, res);
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.status, 'completed');
    assert.deepEqual(body.result, result);
  });

  it('returns failed status with error', () => {
    const job = jobStore.createJob('test', 'openai', 'gpt-5-mini');
    jobStore.updateJob(job.id, { status: STATUS.FAILED, error: 'LLM error' });
    const req = { params: { jobId: job.id } };
    const res = createMockRes();
    handleGetJob(req, res);
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.status, 'failed');
    assert.equal(body.error, 'LLM error');
  });

  it('returns clarification status with result', () => {
    const job = jobStore.createJob('test', 'openai', 'gpt-5-mini');
    const result = { clarifyingQuestion: 'Which tasks?', options: ['All', 'Mine'] };
    jobStore.updateJob(job.id, { status: STATUS.CLARIFICATION, result });
    const req = { params: { jobId: job.id } };
    const res = createMockRes();
    handleGetJob(req, res);
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.status, 'clarification');
    assert.deepEqual(body.result, result);
  });
});
