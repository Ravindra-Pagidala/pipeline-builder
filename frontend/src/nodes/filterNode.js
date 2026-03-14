/**
 * filterNode.js
 * Filters data passing through the pipeline based on a condition.
 * Demonstrates: 1 input, 2 outputs (pass/fail), text + select fields.
 */

import { BaseNode } from './BaseNode';
import { NODE_COLORS } from '../constants/nodeConfig';
import logger from '../utils/logger';

const FILTER_NODE_CONFIG = {
  title: 'Filter',
  color: NODE_COLORS.filter,
  inputs:  [{ id: 'data',  label: 'data'  }],
  outputs: [
    { id: 'pass', label: 'pass' },
    { id: 'fail', label: 'fail' },
  ],
  fields: [
    {
      key: 'condition',
      label: 'Condition',
      type: 'text',
      placeholder: 'e.g. value > 10',
    },
    {
      key: 'operator',
      label: 'Operator',
      type: 'select',
      defaultValue: 'contains',
      options: ['contains', 'equals', 'startsWith', 'endsWith', 'regex'],
    },
  ],
  width: 220,
};

export const FilterNode = ({ id, data }) => {
  if (!id) {
    logger.error('FilterNode: missing required prop "id"');
    return null;
  }
  logger.debug('FilterNode render', { id });
  return <BaseNode id={id} data={data} config={FILTER_NODE_CONFIG} />;
};