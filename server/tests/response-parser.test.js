const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  extractJSON,
  extractReasoning,
  parseDSLResponse,
  DSLValidationError
} = require('../lib/response-parser');

// --- extractJSON ---

describe('extractJSON', () => {
  it('extracts from ```json code block', () => {
    const input = '```json\n{"type":"page","title":"Test","children":[]}\n```';
    assert.equal(extractJSON(input), '{"type":"page","title":"Test","children":[]}');
  });

  it('extracts from ``` code block without language tag', () => {
    const input = '```\n{"type":"page","title":"Test","children":[]}\n```';
    assert.equal(extractJSON(input), '{"type":"page","title":"Test","children":[]}');
  });

  it('extracts raw JSON starting with {', () => {
    const input = '{"type":"page","title":"Test","children":[]}';
    assert.equal(extractJSON(input), '{"type":"page","title":"Test","children":[]}');
  });

  it('extracts JSON embedded in prose', () => {
    const input = 'Here is the UI:\n{"type":"page","title":"Test","children":[]}\nHope this helps!';
    const result = extractJSON(input);
    assert.ok(result.startsWith('{"type":"page"'));
    assert.ok(result.endsWith('}'));
  });

  it('extracts from code block with surrounding text', () => {
    const input = 'I generated this UI for you:\n```json\n{"type":"page","title":"T","children":[]}\n```\nLet me know!';
    assert.equal(extractJSON(input), '{"type":"page","title":"T","children":[]}');
  });

  it('handles whitespace around JSON', () => {
    const input = '  \n  {"type":"page","title":"Test","children":[]}  \n  ';
    assert.ok(extractJSON(input).startsWith('{'));
  });

  it('returns input as-is when no JSON found', () => {
    const input = 'no json here';
    assert.equal(extractJSON(input), 'no json here');
  });
});

// --- extractReasoning ---

describe('extractReasoning', () => {
  it('extracts text before code block', () => {
    const input = 'I chose a data table for this.\n```json\n{}\n```';
    assert.equal(extractReasoning(input), 'I chose a data table for this.');
  });

  it('extracts text before raw JSON', () => {
    const input = 'Here is the result:\n{"type":"page"}';
    assert.equal(extractReasoning(input), 'Here is the result:');
  });

  it('returns empty string when JSON is at start', () => {
    const input = '{"type":"page","title":"Test","children":[]}';
    assert.equal(extractReasoning(input), '');
  });

  it('returns empty string for code block at start', () => {
    const input = '```json\n{}\n```';
    assert.equal(extractReasoning(input), '');
  });

  it('returns empty string for empty input', () => {
    assert.equal(extractReasoning(''), '');
  });
});

// --- parseDSLResponse ---

describe('parseDSLResponse', () => {
  const validPage = JSON.stringify({
    type: 'page',
    title: 'Test',
    children: []
  });

  it('parses valid raw JSON page', () => {
    const { dsl, reasoning } = parseDSLResponse(validPage);
    assert.equal(dsl.type, 'page');
    assert.equal(dsl.title, 'Test');
    assert.equal(reasoning, '');
  });

  it('parses valid JSON in code block', () => {
    const input = '```json\n' + validPage + '\n```';
    const { dsl } = parseDSLResponse(input);
    assert.equal(dsl.type, 'page');
  });

  it('parses JSON with reasoning text before it', () => {
    const input = 'I used a data table for listing.\n' + validPage;
    const { dsl, reasoning } = parseDSLResponse(input);
    assert.equal(dsl.type, 'page');
    assert.equal(reasoning, 'I used a data table for listing.');
  });

  it('parses complex nested DSL', () => {
    const complex = JSON.stringify({
      type: 'page',
      title: 'Dashboard',
      children: [
        {
          type: 'summary-cards',
          cards: [{ label: 'Total', value: 42 }]
        },
        {
          type: 'data-table',
          columns: [{ key: 'id', label: 'ID' }],
          rows: [{ id: 1 }]
        }
      ]
    });
    const { dsl } = parseDSLResponse(complex);
    assert.equal(dsl.children.length, 2);
    assert.equal(dsl.children[0].type, 'summary-cards');
    assert.equal(dsl.children[1].type, 'data-table');
  });

  it('throws on empty input', () => {
    assert.throws(
      () => parseDSLResponse(''),
      { message: /empty or not a string/ }
    );
  });

  it('throws on null input', () => {
    assert.throws(
      () => parseDSLResponse(null),
      { message: /empty or not a string/ }
    );
  });

  it('throws on invalid JSON', () => {
    assert.throws(
      () => parseDSLResponse('not json at all'),
      { message: /Failed to parse JSON/ }
    );
  });

  it('throws DSLValidationError for invalid DSL structure', () => {
    const invalidDSL = JSON.stringify({ type: 'data-table', columns: [], rows: [] });
    try {
      parseDSLResponse(invalidDSL);
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err instanceof DSLValidationError);
      assert.ok(err.errors.length > 0);
      assert.ok(err.message.includes('DSL validation failed'));
    }
  });

  it('throws DSLValidationError with the invalid dsl attached', () => {
    const invalidDSL = JSON.stringify({ type: 'page', title: 'Test' }); // missing children
    try {
      parseDSLResponse(invalidDSL);
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err instanceof DSLValidationError);
      assert.deepEqual(err.dsl, { type: 'page', title: 'Test' });
    }
  });
});

// --- DSLValidationError ---

describe('DSLValidationError', () => {
  it('has name, errors, and dsl properties', () => {
    const err = new DSLValidationError('test', ['err1', 'err2'], { type: 'page' });
    assert.equal(err.name, 'DSLValidationError');
    assert.deepEqual(err.errors, ['err1', 'err2']);
    assert.deepEqual(err.dsl, { type: 'page' });
    assert.ok(err.message.includes('err1'));
    assert.ok(err.message.includes('err2'));
  });

  it('is an instance of Error', () => {
    const err = new DSLValidationError('test', [], {});
    assert.ok(err instanceof Error);
  });
});
