const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');

const {
  SUPPORTED_MODELS,
  PROVIDER_ENV_VARS,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  ApiKeyError,
  ProviderError,
  getModelConfig,
  assertApiKey,
  sleep,
  withRetry,
  createSemaphore
} = require('../lib/llm-client');

// --- Constants ---

describe('SUPPORTED_MODELS', () => {
  it('includes openai and claude providers', () => {
    assert.ok(Array.isArray(SUPPORTED_MODELS.openai));
    assert.ok(Array.isArray(SUPPORTED_MODELS.claude));
  });

  it('lists expected openai models', () => {
    assert.ok(SUPPORTED_MODELS.openai.includes('gpt-5-mini'));
    assert.ok(SUPPORTED_MODELS.openai.includes('gpt-5.2'));
  });

  it('lists expected claude models', () => {
    assert.ok(SUPPORTED_MODELS.claude.includes('claude-sonnet-4-5'));
    assert.ok(SUPPORTED_MODELS.claude.includes('claude-opus-4-5'));
    assert.ok(SUPPORTED_MODELS.claude.includes('claude-haiku-4-5'));
  });
});

describe('DEFAULT_MAX_TOKENS', () => {
  it('is 4096 for UI generation', () => {
    assert.equal(DEFAULT_MAX_TOKENS, 4096);
  });
});

describe('DEFAULT_TEMPERATURE', () => {
  it('is 0.7', () => {
    assert.equal(DEFAULT_TEMPERATURE, 0.7);
  });
});

// --- getModelConfig ---

describe('getModelConfig', () => {
  it('returns config for valid openai model', () => {
    const config = getModelConfig('openai', 'gpt-5-mini');
    assert.deepEqual(config, {
      provider: 'openai',
      model: 'gpt-5-mini',
      envVar: 'OPENAI_API_KEY'
    });
  });

  it('returns config for valid claude model', () => {
    const config = getModelConfig('claude', 'claude-sonnet-4-5');
    assert.deepEqual(config, {
      provider: 'claude',
      model: 'claude-sonnet-4-5',
      envVar: 'ANTHROPIC_API_KEY'
    });
  });

  it('throws for unsupported provider', () => {
    assert.throws(
      () => getModelConfig('gemini', 'gemini-pro'),
      { message: /Unsupported provider: gemini/ }
    );
  });

  it('throws for unsupported model within valid provider', () => {
    assert.throws(
      () => getModelConfig('openai', 'gpt-3.5-turbo'),
      { message: /Unsupported model "gpt-3.5-turbo" for provider "openai"/ }
    );
  });
});

// --- assertApiKey ---

describe('assertApiKey', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns API key when set for openai', () => {
    process.env.OPENAI_API_KEY = 'sk-test-key';
    const key = assertApiKey('openai');
    assert.equal(key, 'sk-test-key');
  });

  it('returns API key when set for claude', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
    const key = assertApiKey('claude');
    assert.equal(key, 'sk-ant-test-key');
  });

  it('throws ApiKeyError when API key is missing for openai', () => {
    delete process.env.OPENAI_API_KEY;
    try {
      assertApiKey('openai');
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err instanceof ApiKeyError);
      assert.ok(err.message.includes('OPENAI_API_KEY'));
    }
  });

  it('throws ApiKeyError when API key is missing for claude', () => {
    delete process.env.ANTHROPIC_API_KEY;
    try {
      assertApiKey('claude');
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err instanceof ApiKeyError);
      assert.ok(err.message.includes('ANTHROPIC_API_KEY'));
    }
  });

  it('throws ProviderError for unsupported provider', () => {
    try {
      assertApiKey('unsupported');
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err instanceof ProviderError);
      assert.ok(err.message.includes('unsupported'));
    }
  });
});

// --- ApiKeyError / ProviderError ---

describe('ApiKeyError', () => {
  it('is an instance of Error', () => {
    const err = new ApiKeyError('TEST_KEY');
    assert.ok(err instanceof Error);
    assert.equal(err.name, 'ApiKeyError');
  });
});

describe('ProviderError', () => {
  it('is an instance of Error', () => {
    const err = new ProviderError('test-provider');
    assert.ok(err instanceof Error);
    assert.equal(err.name, 'ProviderError');
  });
});

// --- sleep ---

describe('sleep', () => {
  it('resolves after the specified delay', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    assert.ok(elapsed >= 40, `Expected >= 40ms, got ${elapsed}ms`);
  });
});

// --- withRetry ---

describe('withRetry', () => {
  it('returns result on first successful attempt', async () => {
    let calls = 0;
    const result = await withRetry(() => {
      calls++;
      return 'success';
    });
    assert.equal(result, 'success');
    assert.equal(calls, 1);
  });

  it('retries on failure and returns eventual success', async () => {
    let calls = 0;
    const result = await withRetry(() => {
      calls++;
      if (calls < 3) throw new Error('fail');
      return 'success';
    }, { maxAttempts: 3, baseDelay: 10 });
    assert.equal(result, 'success');
    assert.equal(calls, 3);
  });

  it('throws after exhausting all attempts', async () => {
    let calls = 0;
    await assert.rejects(
      () => withRetry(() => {
        calls++;
        throw new Error('persistent failure');
      }, { maxAttempts: 3, baseDelay: 10 }),
      { message: 'persistent failure' }
    );
    assert.equal(calls, 3);
  });

  it('uses exponential backoff delays', async () => {
    const timestamps = [];
    let calls = 0;

    await assert.rejects(
      () => withRetry(() => {
        calls++;
        timestamps.push(Date.now());
        throw new Error('fail');
      }, { maxAttempts: 3, baseDelay: 50 })
    );

    assert.equal(timestamps.length, 3);
    // First retry delay should be ~50ms (baseDelay * 2^0)
    const firstDelay = timestamps[1] - timestamps[0];
    assert.ok(firstDelay >= 40, `First delay ${firstDelay}ms should be >= 40ms`);
    // Second retry delay should be ~100ms (baseDelay * 2^1)
    const secondDelay = timestamps[2] - timestamps[1];
    assert.ok(secondDelay >= 80, `Second delay ${secondDelay}ms should be >= 80ms`);
  });

  it('defaults to 3 attempts', async () => {
    let calls = 0;
    await assert.rejects(
      () => withRetry(() => {
        calls++;
        throw new Error('fail');
      }, { baseDelay: 10 })
    );
    assert.equal(calls, 3);
  });
});

// --- createSemaphore ---

describe('createSemaphore', () => {
  it('allows up to the limit of concurrent acquisitions', async () => {
    const sem = createSemaphore(2);
    let active = 0;
    let maxActive = 0;

    const task = async () => {
      await sem.acquire();
      active++;
      maxActive = Math.max(maxActive, active);
      await sleep(20);
      active--;
      sem.release();
    };

    await Promise.all([task(), task(), task(), task()]);
    assert.equal(maxActive, 2);
  });

  it('queues acquisitions beyond the limit', async () => {
    const sem = createSemaphore(1);
    const order = [];

    const task = async (id) => {
      await sem.acquire();
      order.push(`start-${id}`);
      await sleep(10);
      order.push(`end-${id}`);
      sem.release();
    };

    await Promise.all([task('a'), task('b'), task('c')]);
    // Tasks should execute sequentially with limit=1
    assert.equal(order.length, 6);
    assert.equal(order[0], 'start-a');
    assert.equal(order[1], 'end-a');
  });

  it('works with limit of 0 (nothing runs until release)', async () => {
    const sem = createSemaphore(0);
    let acquired = false;

    const p = sem.acquire().then(() => { acquired = true; });
    await sleep(20);
    assert.equal(acquired, false);

    sem.release(); // manually pump — release increments then dequeues
    await p;
    assert.equal(acquired, true);
  });
});
