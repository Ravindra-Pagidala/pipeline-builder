/**
 * outputNode.js
 *
 * Fix 1: Same pattern as inputNode — data.outputName is pre-populated
 *        at drop time so the header shows "output_1" immediately.
 */

import { BaseNode } from './BaseNode';
import { NODE_COLORS } from '../constants/nodeConfig';
import logger from '../utils/logger';

export const OutputNode = ({ id, data }) => {
  if (!id) {
    logger.error('OutputNode: missing id');
    return null;
  }

  const defaultName = data?.outputName || id.replace('customOutput-', 'output_');

  const config = {
    title:   'Output',
    color:   NODE_COLORS.customOutput,
    nameKey: 'outputName',
    inputs:  [{ id: 'value', label: 'value' }],
    outputs: [],
    fields: [
      {
        key:          'outputName',
        label:        'Name',
        type:         'text',
        defaultValue: defaultName,
        placeholder:  'e.g. output_0',
      },
      {
        key:          'outputType',
        label:        'Type',
        type:         'select',
        defaultValue: data?.outputType || 'Text',
        options:      ['Text', 'Image', 'File'],
      },
    ],
    width: 220,
  };

  logger.debug('OutputNode render', { id, defaultName });
  return <BaseNode id={id} data={data} config={config} />;
};