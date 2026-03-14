/**
 * inputNode.js
 * Represents an entry point for data into the pipeline.
 * Refactored to use BaseNode — config-driven, no duplicated markup.
 */

import { BaseNode } from './BaseNode';
import { NODE_COLORS } from '../constants/nodeConfig';
import logger from '../utils/logger';

const INPUT_NODE_CONFIG = {
  title: 'Input',
  color: NODE_COLORS.customInput,
  nameKey: 'inputName',        // field whose value shows in the header
  inputs: [],  // No incoming connections — this is a source node
  outputs: [
    { id: 'value', label: 'value' },
  ],
  fields: [
    {
      key: 'inputName',
      label: 'Name',
      type: 'text',
      placeholder: 'e.g. input_0',
    },
    {
      key: 'inputType',
      label: 'Type',
      type: 'select',
      defaultValue: 'Text',
      options: ['Text', 'File', 'Image', 'Number'],
    },
  ],
  width: 220,
};

export const InputNode = ({ id, data }) => {
  if (!id) {
    logger.error('InputNode: missing required prop "id"');
    return null;
  }

  // Derive a human-friendly default name from the ReactFlow id
  // e.g. "customInput-1" → "input_1"
  const defaultName = id.replace('customInput-', 'input_');

  const config = {
    ...INPUT_NODE_CONFIG,
    fields: INPUT_NODE_CONFIG.fields.map((field) => ({
      ...field,
      defaultValue:
        field.key === 'inputName'
          ? (data?.[field.key] || defaultName)
          : (data?.[field.key] ?? field.defaultValue ?? ''),
    })),
  };

  logger.debug('InputNode render', { id });

  return <BaseNode id={id} data={data} config={config} />;
};