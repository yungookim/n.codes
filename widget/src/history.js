/**
 * Feature history — persists generated features in localStorage.
 * Stores templateId (not full HTML) to keep storage small.
 */

const STORAGE_KEY = 'ncodes:history';
const MAX_ENTRIES = 20;

function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function addToHistory({ prompt, templateId }) {
  const history = getHistory();
  const entry = {
    id: String(Date.now()),
    prompt,
    templateId,
    timestamp: Date.now(),
  };
  history.unshift(entry);
  if (history.length > MAX_ENTRIES) {
    history.length = MAX_ENTRIES;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return entry;
}

function removeFromHistory(id) {
  const history = getHistory().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

module.exports = { getHistory, addToHistory, removeFromHistory, clearHistory, STORAGE_KEY, MAX_ENTRIES };
