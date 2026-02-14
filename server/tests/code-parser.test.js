'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseCodeBlocks, extractReasoning, validateParsedCode } = require('../lib/code-parser');

// --- parseCodeBlocks ---

describe('parseCodeBlocks', () => {
  it('extracts HTML from ```html fenced block', () => {
    const input = [
      'Here is the HTML:',
      '```html',
      '<div class="kanban">Hello</div>',
      '```',
    ].join('\n');
    const result = parseCodeBlocks(input);
    assert.ok(result.html.includes('<div class="kanban">Hello</div>'));
  });

  it('extracts CSS from ```css fenced block', () => {
    const input = [
      '```css',
      '.kanban { display: flex; gap: 1rem; }',
      '```',
    ].join('\n');
    const result = parseCodeBlocks(input);
    assert.ok(result.css.includes('.kanban'));
    assert.ok(result.css.includes('display: flex'));
  });

  it('extracts JS from ```javascript fenced block', () => {
    const input = [
      '```javascript',
      'const tasks = await ncodes.query("listTasks");',
      '```',
    ].join('\n');
    const result = parseCodeBlocks(input);
    assert.ok(result.js.includes('ncodes.query'));
  });

  it('extracts JS from ```js fenced block', () => {
    const input = [
      '```js',
      'const data = await ncodes.query("listTasks");',
      '```',
    ].join('\n');
    const result = parseCodeBlocks(input);
    assert.ok(result.js.includes('ncodes.query'));
  });

  it('extracts all three sections from a complete response', () => {
    const input = [
      'I created a task list UI.',
      '',
      '```html',
      '<div id="tasks"><h2>Tasks</h2><ul id="list"></ul></div>',
      '```',
      '',
      '```css',
      '#tasks { padding: 1rem; }',
      '#list { list-style: none; }',
      '```',
      '',
      '```javascript',
      'const tasks = await ncodes.query("listTasks");',
      'tasks.forEach(t => {',
      '  const li = document.createElement("li");',
      '  li.textContent = t.title;',
      '  document.getElementById("list").appendChild(li);',
      '});',
      '```',
    ].join('\n');

    const result = parseCodeBlocks(input);
    assert.ok(result.html.includes('<div id="tasks">'));
    assert.ok(result.css.includes('#tasks'));
    assert.ok(result.js.includes('ncodes.query("listTasks")'));
  });

  it('returns empty strings when no code blocks are present', () => {
    const input = 'No code blocks here, just text.';
    const result = parseCodeBlocks(input);
    assert.equal(result.html, '');
    assert.equal(result.css, '');
    assert.equal(result.js, '');
  });

  it('handles response with only HTML', () => {
    const input = [
      '```html',
      '<p>Hello</p>',
      '```',
    ].join('\n');
    const result = parseCodeBlocks(input);
    assert.ok(result.html.includes('<p>Hello</p>'));
    assert.equal(result.css, '');
    assert.equal(result.js, '');
  });

  it('handles multiline code blocks', () => {
    const input = [
      '```html',
      '<div>',
      '  <h1>Title</h1>',
      '  <p>Paragraph</p>',
      '</div>',
      '```',
    ].join('\n');
    const result = parseCodeBlocks(input);
    assert.ok(result.html.includes('<h1>Title</h1>'));
    assert.ok(result.html.includes('<p>Paragraph</p>'));
  });

  it('trims whitespace from extracted code', () => {
    const input = [
      '```html',
      '',
      '  <div>content</div>',
      '',
      '```',
    ].join('\n');
    const result = parseCodeBlocks(input);
    assert.ok(!result.html.startsWith('\n'));
    assert.ok(!result.html.endsWith('\n'));
  });

  it('concatenates multiple HTML blocks', () => {
    const input = [
      '```html',
      '<header>Top</header>',
      '```',
      'Some text.',
      '```html',
      '<footer>Bottom</footer>',
      '```',
    ].join('\n');
    const result = parseCodeBlocks(input);
    assert.ok(result.html.includes('<header>Top</header>'));
    assert.ok(result.html.includes('<footer>Bottom</footer>'));
  });

  it('returns empty for null input', () => {
    const result = parseCodeBlocks(null);
    assert.equal(result.html, '');
    assert.equal(result.css, '');
    assert.equal(result.js, '');
  });

  it('returns empty for non-string input', () => {
    const result = parseCodeBlocks(42);
    assert.equal(result.html, '');
  });

  it('includes reasoning text', () => {
    const input = [
      'Here is my approach.',
      '```html',
      '<p>Hello</p>',
      '```',
    ].join('\n');
    const result = parseCodeBlocks(input);
    assert.ok(result.reasoning.includes('Here is my approach'));
  });
});

// --- extractReasoning ---

describe('extractReasoning', () => {
  it('extracts text outside code blocks', () => {
    const input = [
      'This is reasoning text.',
      '```html',
      '<div>code</div>',
      '```',
      'More reasoning.',
    ].join('\n');
    const result = extractReasoning(input);
    assert.ok(result.includes('This is reasoning text.'));
    assert.ok(result.includes('More reasoning.'));
    assert.ok(!result.includes('<div>code</div>'));
  });

  it('collapses multiple blank lines', () => {
    const input = [
      'Before.',
      '',
      '',
      '',
      '',
      'After.',
    ].join('\n');
    const result = extractReasoning(input);
    // Should not have more than 2 consecutive newlines
    assert.ok(!result.includes('\n\n\n'));
  });

  it('trims leading and trailing whitespace', () => {
    const result = extractReasoning('  Some text  ');
    assert.equal(result, 'Some text');
  });
});

// --- validateParsedCode ---

describe('validateParsedCode', () => {
  it('returns valid when HTML is present', () => {
    const result = validateParsedCode({ html: '<div>hello</div>', css: '', js: '' });
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('returns invalid when HTML is empty', () => {
    const result = validateParsedCode({ html: '', css: '.foo {}', js: 'alert(1)' });
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors[0].includes('HTML'));
  });

  it('returns invalid when HTML is missing', () => {
    const result = validateParsedCode({ css: '', js: '' });
    assert.equal(result.valid, false);
  });
});
