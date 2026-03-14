/**
 * transformNode.js
 * Applies a string transformation to the incoming data.
 * Demonstrates: 1 input, 1 output, select + toggle fields.
 */

import { BaseNode } from './BaseNode';
import { NODE_COLORS } from '../constants/nodeConfig';
import logger from '../utils/logger';

const TRANSFORM_NODE_CONFIG = {
  title: 'Transform',
  color: NODE_COLORS.transform,
  inputs:  [{ id: 'input',  label: 'input'  }],
  outputs: [{ id: 'output', label: 'output' }],
  fields: [
    {
      key: 'transformType',
      label: 'Transform',
      type: 'select',
      defaultValue: 'uppercase',
      options: [
        { value: 'uppercase',  label: 'UPPERCASE' },
        { value: 'lowercase',  label: 'lowercase' },
        { value: 'trim',       label: 'Trim whitespace' },
        { value: 'reverse',    label: 'Reverse string' },
        { value: 'stringify',  label: 'JSON Stringify' },
        { value: 'parse',      label: 'JSON Parse' },
      ],
    },
    {
      key: 'preserveOriginal',
      label: 'Preserve original',
      type: 'toggle',
      defaultValue: false,
    },
  ],
  width: 230,
};

export const TransformNode = ({ id, data }) => {
  if (!id) {
    logger.error('TransformNode: missing required prop "id"');
    return null;
  }
  logger.debug('TransformNode render', { id });
  return <BaseNode id={id} data={data} config={TRANSFORM_NODE_CONFIG} />;
};