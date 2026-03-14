/**
 * inputNode.js
 *
 * Fix 1: defaultValue for inputName now reads from data.inputName first
 *        (which is pre-populated at drop time in ui.js), so the header
 *        shows "input_1" immediately without the user needing to type.
 */

import { BaseNode } from './BaseNode';
import { NODE_COLORS } from '../constants/nodeConfig';
import logger from '../utils/logger';

export const InputNode = ({ id, data }) => {
  if (!id) {
    logger.error('InputNode: missing id');
    return null;
  }

  // ui.js now writes inputName into data at drop time,
  // so data.inputName is already "input_1" on first render.
  // Fall back to id-derived name only if somehow missing.
  const defaultName = data?.inputName || id.replace('customInput-', 'input_');

  const config = {
    title:   'Input',
    color:   NODE_COLORS.customInput,
    nameKey: 'inputName',
    inputs:  [],
    outputs: [{ id: 'value', label: 'value' }],
    fields: [
      {
        key:          'inputName',
        label:        'Name',
        type:         'text',
        defaultValue: defaultName,
        placeholder:  'e.g. input_0',
      },
      {
        key:          'inputType',
        label:        'Type',
        type:         'select',
        defaultValue: data?.inputType || 'Text',
        options:      ['Text', 'File', 'Image', 'Number'],
      },
    ],
    width: 220,
  };

  logger.debug('InputNode render', { id, defaultName });
  return <BaseNode id={id} data={data} config={config} />;
};