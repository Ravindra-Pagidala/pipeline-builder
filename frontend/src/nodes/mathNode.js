/**
 * mathNode.js
 * Performs a mathematical operation on two inputs.
 * Demonstrates: 2 inputs, 1 output, dropdown field.
 */

import { BaseNode } from './BaseNode';
import { NODE_COLORS } from '../constants/nodeConfig';
import logger from '../utils/logger';

const MATH_NODE_CONFIG = {
  title: 'Math',
  color: NODE_COLORS.math,
  inputs: [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
  ],
  outputs: [{ id: 'result', label: 'result' }],
  fields: [
    {
      key: 'operation',
      label: 'Operation',
      type: 'select',
      defaultValue: 'add',
      options: [
        { value: 'add',      label: 'Add  (A + B)' },
        { value: 'subtract', label: 'Subtract  (A − B)' },
        { value: 'multiply', label: 'Multiply  (A × B)' },
        { value: 'divide',   label: 'Divide  (A ÷ B)' },
        { value: 'modulo',   label: 'Modulo  (A % B)' },
        { value: 'power',    label: 'Power  (A ^ B)' },
      ],
    },
  ],
  width: 220,
};

export const MathNode = ({ id, data }) => {
  if (!id) {
    logger.error('MathNode: missing required prop "id"');
    return null;
  }
  logger.debug('MathNode render', { id });
  return <BaseNode id={id} data={data} config={MATH_NODE_CONFIG} />;
};