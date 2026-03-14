/**
 * nodeUtils.js
 * Pure helper functions — no React imports, fully testable.
 */

import logger from './logger';

/**
 * Validates a BaseNode config object.
 */
export function validateNodeConfig(config) {
  if (!config || typeof config !== 'object') {
    const msg = 'validateNodeConfig: config must be a non-null object';
    logger.error(msg, config);
    throw new TypeError(msg);
  }
  if (!config.title || typeof config.title !== 'string') {
    const msg = `validateNodeConfig: "title" must be a non-empty string`;
    logger.error(msg);
    throw new TypeError(msg);
  }
  if (config.inputs !== undefined && !Array.isArray(config.inputs)) {
    throw new TypeError('validateNodeConfig: "inputs" must be an array');
  }
  if (config.outputs !== undefined && !Array.isArray(config.outputs)) {
    throw new TypeError('validateNodeConfig: "outputs" must be an array');
  }
  if (config.fields !== undefined && !Array.isArray(config.fields)) {
    throw new TypeError('validateNodeConfig: "fields" must be an array');
  }
}

/**
 * Extracts unique variable names from {{varName}} patterns.
 *
 * Accepts:
 *   - Valid JS identifiers:  input_1, myVar, _foo
 *   - Hyphenated names:      llm-1, delay-1, transform-1
 *     (node IDs use hyphens — we need to support them)
 *
 * Pattern: starts with letter or underscore, then any mix of
 * letters, digits, underscores, or hyphens.
 *
 * @param {string} text
 * @returns {string[]} deduplicated variable names
 */
export function extractVariables(text) {
  if (typeof text !== 'string') {
    logger.warn('extractVariables: expected string, got', typeof text);
    return [];
  }
  try {
    // Updated: allow hyphens inside names (e.g. llm-1, delay-1)
    // Supports "{{varName}}" and "{{ varName }}" (spaces trimmed)
    const regex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_\-]*)\s*\}\}/g;
    const found = new Set();
    let match;
    while ((match = regex.exec(text)) !== null) {
      found.add(match[1].trim());
    }
    return Array.from(found);
  } catch (err) {
    logger.error('extractVariables: regex failed', err);
    return [];
  }
}

/**
 * Computes evenly-spaced % positions for N handles on a node edge.
 * @param {number} count
 * @returns {number[]}
 */
export function computeHandlePositions(count) {
  if (!count || count <= 0) return [];
  if (count === 1) return [50];
  return Array.from({ length: count }, (_, i) =>
    Math.round(((i + 1) / (count + 1)) * 100)
  );
}

/**
 * Builds a stable ReactFlow handle id: "<nodeId>-<suffix>"
 * @param {string} nodeId
 * @param {string} suffix
 * @returns {string}
 */
export function makeHandleId(nodeId, suffix) {
  if (!nodeId || !suffix) {
    logger.warn('makeHandleId: nodeId or suffix is falsy', { nodeId, suffix });
  }
  return `${nodeId}-${suffix}`;
}