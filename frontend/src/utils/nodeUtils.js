/**
 * nodeUtils.js
 * Pure helper functions for node-related operations.
 * No React imports — fully testable in isolation.
 */

import logger from './logger';

/**
 * Validates a BaseNode config object.
 * Throws with a descriptive message if required fields are missing.
 * @param {object} config
 */
export function validateNodeConfig(config) {
  if (!config || typeof config !== 'object') {
    const msg = 'validateNodeConfig: config must be a non-null object';
    logger.error(msg, config);
    throw new TypeError(msg);
  }

  if (!config.title || typeof config.title !== 'string') {
    const msg = `validateNodeConfig: "title" must be a non-empty string (got ${JSON.stringify(config.title)})`;
    logger.error(msg);
    throw new TypeError(msg);
  }

  if (config.inputs !== undefined && !Array.isArray(config.inputs)) {
    const msg = 'validateNodeConfig: "inputs" must be an array if provided';
    logger.error(msg);
    throw new TypeError(msg);
  }

  if (config.outputs !== undefined && !Array.isArray(config.outputs)) {
    const msg = 'validateNodeConfig: "outputs" must be an array if provided';
    logger.error(msg);
    throw new TypeError(msg);
  }

  if (config.fields !== undefined && !Array.isArray(config.fields)) {
    const msg = 'validateNodeConfig: "fields" must be an array if provided';
    logger.error(msg);
    throw new TypeError(msg);
  }
}

/**
 * Extracts unique, valid JS variable names from a {{varName}} pattern.
 * A valid JS identifier: starts with letter or _, followed by letters/digits/_.
 * @param {string} text
 * @returns {string[]} sorted, deduplicated variable names
 */
export function extractVariables(text) {
  if (typeof text !== 'string') {
    logger.warn('extractVariables: expected string, got', typeof text);
    return [];
  }

  try {
    const regex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
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
 * Computes evenly-spaced percentage positions for N handles.
 * @param {number} count
 * @returns {number[]} array of percentages (0–100)
 */
export function computeHandlePositions(count) {
  if (!count || count <= 0) return [];
  if (count === 1) return [50];

  return Array.from({ length: count }, (_, i) =>
    Math.round(((i + 1) / (count + 1)) * 100)
  );
}

/**
 * Generates a stable handle id from node id + suffix.
 * Keeps handle IDs deterministic so ReactFlow edges survive re-renders.
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