/**
 * outputNode.js
 * Represents the terminal/sink node of a pipeline — where results land.
 * Refactored to use BaseNode.
 */

import { BaseNode } from './BaseNode';
import { NODE_COLORS } from '../constants/nodeConfig';
import logger from '../utils/logger';

const OUTPUT_NODE_CONFIG = {
  title: 'Output',
  color: NODE_COLORS.customOutput,
  nameKey: 'outputName',
  inputs: [
    { id: 'value', label: 'value' },
  ],
  outputs: [], // Terminal node — no outgoing connections
  fields: [
    {
      key: 'outputName',
      label: 'Name',
      type: 'text',
      placeholder: 'e.g. output_0',
    },
    {
      key: 'outputType',
      label: 'Type',
      type: 'select',
      defaultValue: 'Text',
      options: ['Text', 'Image', 'File'],
    },
  ],
  width: 220,
};

export const OutputNode = ({ id, data }) => {
  if (!id) {
    logger.error('OutputNode: missing required prop "id"');
    return null;
  }

  const defaultName = id.replace('customOutput-', 'output_');

  const config = {
    ...OUTPUT_NODE_CONFIG,
    fields: OUTPUT_NODE_CONFIG.fields.map((field) => ({
      ...field,
      defaultValue:
        field.key === 'outputName'
          ? (data?.[field.key] || defaultName)
          : (data?.[field.key] ?? field.defaultValue ?? ''),
    })),
  };

  logger.debug('OutputNode render', { id });

  return <BaseNode id={id} data={data} config={config} />;
};