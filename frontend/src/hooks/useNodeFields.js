/**
 * useNodeFields.js
 * Custom hook that manages field values for any node.
 * Keeps BaseNode stateless about what its fields contain —
 * all field state lives here and syncs to the Zustand store.
 */

import { useState, useCallback } from 'react';
import { useStore } from '../store';
import logger from '../utils/logger';

/**
 * @param {string} nodeId        - ReactFlow node id
 * @param {object} initialValues - { fieldKey: defaultValue, ... }
 * @returns {{ values, handleChange }}
 */
export function useNodeFields(nodeId, initialValues = {}) {
  if (!nodeId) {
    logger.error('useNodeFields: nodeId is required');
  }

  const updateNodeField = useStore((state) => state.updateNodeField);

  const [values, setValues] = useState(() => {
    // Guard: ensure initialValues is always an object
    if (!initialValues || typeof initialValues !== 'object') {
      logger.warn('useNodeFields: initialValues is not an object, defaulting to {}');
      return {};
    }
    return { ...initialValues };
  });

  const handleChange = useCallback(
    (fieldKey, value) => {
      if (!fieldKey) {
        logger.warn('useNodeFields.handleChange: fieldKey is empty');
        return;
      }

      setValues((prev) => ({ ...prev, [fieldKey]: value }));

      try {
        updateNodeField(nodeId, fieldKey, value);
      } catch (err) {
        logger.error('useNodeFields: failed to sync field to store', {
          nodeId,
          fieldKey,
          err,
        });
      }
    },
    [nodeId, updateNodeField]
  );

  return { values, handleChange };
}