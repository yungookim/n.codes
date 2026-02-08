const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// Minimal localStorage mock for Node
const store = {};
global.localStorage = {
  getItem: (key) => (key in store ? store[key] : null),
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
};

const {
  getHistory,
  addToHistory,
  removeFromHistory,
  clearHistory,
  STORAGE_KEY,
  MAX_ENTRIES,
} = require('../src/history');

describe('history', () => {
  beforeEach(() => {
    delete store[STORAGE_KEY];
  });

  describe('getHistory', () => {
    it('returns empty array when no localStorage data', () => {
      assert.deepEqual(getHistory(), []);
    });

    it('returns parsed array from localStorage', () => {
      const data = [{ id: '1', prompt: 'test', templateId: 'invoices', timestamp: 1000 }];
      store[STORAGE_KEY] = JSON.stringify(data);
      assert.deepEqual(getHistory(), data);
    });

    it('returns empty array for corrupted JSON', () => {
      store[STORAGE_KEY] = 'not-valid-json{{{';
      assert.deepEqual(getHistory(), []);
    });

    it('returns empty array if stored value is not an array', () => {
      store[STORAGE_KEY] = JSON.stringify({ key: 'value' });
      assert.deepEqual(getHistory(), []);
    });
  });

  describe('addToHistory', () => {
    it('prepends entry with id and timestamp', () => {
      const entry = addToHistory({ prompt: 'Show invoices', templateId: 'invoices' });
      assert.ok(entry.id);
      assert.ok(entry.timestamp);
      assert.equal(entry.prompt, 'Show invoices');
      assert.equal(entry.templateId, 'invoices');

      const history = getHistory();
      assert.equal(history.length, 1);
      assert.equal(history[0].prompt, 'Show invoices');
    });

    it('prepends new entries (most recent first)', () => {
      addToHistory({ prompt: 'first', templateId: 'invoices' });
      addToHistory({ prompt: 'second', templateId: 'dashboard' });
      const history = getHistory();
      assert.equal(history.length, 2);
      assert.equal(history[0].prompt, 'second');
      assert.equal(history[1].prompt, 'first');
    });

    it('caps at MAX_ENTRIES', () => {
      for (let i = 0; i < MAX_ENTRIES + 5; i++) {
        addToHistory({ prompt: `prompt-${i}`, templateId: 'invoices' });
      }
      const history = getHistory();
      assert.equal(history.length, MAX_ENTRIES);
      // Most recent should be first
      assert.equal(history[0].prompt, `prompt-${MAX_ENTRIES + 4}`);
    });

    it('returns the new entry', () => {
      const entry = addToHistory({ prompt: 'test', templateId: 'archive' });
      assert.equal(entry.prompt, 'test');
      assert.equal(entry.templateId, 'archive');
      assert.equal(typeof entry.id, 'string');
      assert.equal(typeof entry.timestamp, 'number');
    });
  });

  describe('removeFromHistory', () => {
    it('removes entry by id', () => {
      addToHistory({ prompt: 'first', templateId: 'invoices' });
      // Read back the history to get the actual stored entry with its id
      const history = getHistory();
      const idToRemove = history[0].id;
      // Manually add a second entry with a different id to avoid same-ms collision
      store[STORAGE_KEY] = JSON.stringify([
        { id: 'keep-me', prompt: 'to keep', templateId: 'dashboard', timestamp: 2000 },
        { id: 'remove-me', prompt: 'to remove', templateId: 'invoices', timestamp: 1000 },
      ]);
      const remaining = removeFromHistory('remove-me');
      assert.equal(remaining.length, 1);
      assert.equal(remaining[0].prompt, 'to keep');
    });

    it('returns unchanged array if id not found', () => {
      addToHistory({ prompt: 'only one', templateId: 'invoices' });
      const remaining = removeFromHistory('nonexistent');
      assert.equal(remaining.length, 1);
    });
  });

  describe('clearHistory', () => {
    it('empties storage', () => {
      addToHistory({ prompt: 'some', templateId: 'invoices' });
      clearHistory();
      assert.deepEqual(getHistory(), []);
      assert.equal(store[STORAGE_KEY], undefined);
    });
  });
});
