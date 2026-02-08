const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { findTemplate, getTemplateHTML, PROMPT_TEMPLATES, STATUS_MESSAGES } = require('../src/simulation');

describe('simulation', () => {
  describe('findTemplate', () => {
    it('matches invoice keywords', () => {
      assert.equal(findTemplate('Show overdue invoices'), 'invoices');
      assert.equal(findTemplate('send a reminder'), 'invoices');
      assert.equal(findTemplate('INVOICE list'), 'invoices');
    });

    it('matches dashboard keywords', () => {
      assert.equal(findTemplate('customer health overview'), 'dashboard');
      assert.equal(findTemplate('show me the dashboard'), 'dashboard');
      assert.equal(findTemplate('engagement metrics'), 'dashboard');
      assert.equal(findTemplate('churn analysis'), 'dashboard');
    });

    it('matches archive keywords', () => {
      assert.equal(findTemplate('archive old users'), 'archive');
      assert.equal(findTemplate('inactive accounts'), 'archive');
      assert.equal(findTemplate('bulk delete'), 'archive');
      assert.equal(findTemplate('user management'), 'archive');
    });

    it('defaults to invoices for unknown prompts', () => {
      assert.equal(findTemplate('something random'), 'invoices');
      assert.equal(findTemplate(''), 'invoices');
    });

    it('is case insensitive', () => {
      assert.equal(findTemplate('DASHBOARD'), 'dashboard');
      assert.equal(findTemplate('Archive'), 'archive');
      assert.equal(findTemplate('Invoice'), 'invoices');
    });
  });

  describe('getTemplateHTML', () => {
    it('returns HTML string for invoices', () => {
      const html = getTemplateHTML('invoices');
      assert.ok(typeof html === 'string');
      assert.ok(html.includes('Overdue Invoices'));
      assert.ok(html.includes('data-ncodes-close'));
    });

    it('returns HTML string for dashboard', () => {
      const html = getTemplateHTML('dashboard');
      assert.ok(html.includes('Customer Health Dashboard'));
      assert.ok(html.includes('health-stats'));
    });

    it('returns HTML string for archive', () => {
      const html = getTemplateHTML('archive');
      assert.ok(html.includes('Bulk Archive'));
      assert.ok(html.includes('data-ncodes-select-all'));
    });

    it('defaults to invoices for unknown template', () => {
      const html = getTemplateHTML('unknown');
      assert.ok(html.includes('Overdue Invoices'));
    });
  });

  describe('PROMPT_TEMPLATES', () => {
    it('maps keywords to template IDs', () => {
      assert.equal(PROMPT_TEMPLATES.invoice, 'invoices');
      assert.equal(PROMPT_TEMPLATES.health, 'dashboard');
      assert.equal(PROMPT_TEMPLATES.archive, 'archive');
    });
  });

  describe('STATUS_MESSAGES', () => {
    it('has the expected number of messages', () => {
      assert.equal(STATUS_MESSAGES.length, 6);
    });

    it('ends with Done!', () => {
      assert.equal(STATUS_MESSAGES[STATUS_MESSAGES.length - 1], 'Done!');
    });

    it('starts with Analyzing', () => {
      assert.ok(STATUS_MESSAGES[0].startsWith('Analyzing'));
    });
  });
});
