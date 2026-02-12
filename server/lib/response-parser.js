'use strict';

const path = require('path');
const { validateDSL } = require(path.join(__dirname, '..', '..', 'shared', 'dsl-types'));

/**
 * Extract JSON from LLM response text.
 * Handles: raw JSON, ```json code blocks, ``` code blocks, JSON embedded in prose.
 *
 * @param {string} text - Raw LLM response text
 * @returns {string} Extracted JSON string
 */
function extractJSON(text) {
  const trimmed = text.trim();

  // Try markdown code block first: ```json ... ``` or ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try raw JSON (starts with { and ends with })
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  // Return as-is — let JSON.parse fail with a clear error
  return trimmed;
}

/**
 * Extract reasoning text from LLM response (text outside the JSON block).
 *
 * @param {string} text - Raw LLM response text
 * @returns {string} Reasoning text, or empty string
 */
function extractReasoning(text) {
  const trimmed = text.trim();

  // If there's a code block, reasoning is the text before it
  const codeBlockIndex = trimmed.indexOf('```');
  if (codeBlockIndex >= 0) {
    return codeBlockIndex > 0 ? trimmed.slice(0, codeBlockIndex).trim() : '';
  }

  // If raw JSON, reasoning is text before the first {
  const firstBrace = trimmed.indexOf('{');
  if (firstBrace > 0) {
    return trimmed.slice(0, firstBrace).trim();
  }

  return '';
}

/**
 * Parse and validate DSL from LLM response text.
 *
 * @param {string} text - Raw LLM response text
 * @returns {{dsl: object, reasoning: string}} Parsed and validated DSL
 * @throws {Error} If JSON extraction or DSL validation fails
 */
function parseDSLResponse(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Response text is empty or not a string');
  }

  const jsonStr = extractJSON(text);
  const reasoning = extractReasoning(text);

  let dsl;
  try {
    dsl = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error(`Failed to parse JSON from LLM response: ${err.message}`);
  }

  const { valid, errors } = validateDSL(dsl);
  if (!valid) {
    throw new DSLValidationError('DSL validation failed', errors, dsl);
  }

  return { dsl, reasoning };
}

class DSLValidationError extends Error {
  constructor(message, errors, dsl) {
    super(`${message}: ${errors.join('; ')}`);
    this.name = 'DSLValidationError';
    this.errors = errors;
    this.dsl = dsl;
  }
}

module.exports = {
  extractJSON,
  extractReasoning,
  parseDSLResponse,
  DSLValidationError
};
