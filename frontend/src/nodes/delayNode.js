/**
 * delayNode.js
 * Introduces a configurable delay in the pipeline execution.
 * Demonstrates: 1 input, 1 output, number field.
 */

import { BaseNode } from './BaseNode';
import { NODE_COLORS } from '../constants/nodeConfig';
import logger from '../utils/logger';

const DELAY_NODE_CONFIG = {
  title: 'Delay',
  color: NODE_COLORS.delay,
  inputs:  [{ id: 'input',  label: 'input'  }],
  outputs: [{ id: 'output', label: 'output' }],
  fields: [
    {
      key: 'delayMs',
      label: 'Delay (ms)',
      type: 'number',
      defaultValue: 1000,
      placeholder: 'milliseconds',
    },
    {
      key: 'unit',
      label: 'Unit',
      type: 'select',
      defaultValue: 'ms',
      options: [
        { value: 'ms', label: 'Milliseconds' },
        { value: 's',  label: 'Seconds' },
        { value: 'm',  label: 'Minutes' },
      ],
    },
  ],
  width: 220,
};

export const DelayNode = ({ id, data }) => {
  if (!id) {
    logger.error('DelayNode: missing required prop "id"');
    return null;
  }
  logger.debug('DelayNode render', { id });
  return <BaseNode id={id} data={data} config={DELAY_NODE_CONFIG} />;
};