/**
 * noteNode.js
 * A non-functional annotation node for adding comments to the canvas.
 * Demonstrates: 0 inputs, 0 outputs, textarea field only.
 */

import { BaseNode } from './BaseNode';
import { NODE_COLORS } from '../constants/nodeConfig';
import logger from '../utils/logger';

const NOTE_NODE_CONFIG = {
  title: 'Note',
  color: NODE_COLORS.note,
  inputs:  [],
  outputs: [],
  fields: [
    {
      key: 'note',
      label: 'Content',
      type: 'textarea',
      defaultValue: '',
      placeholder: 'Add a note to document your pipeline…',
      rows: 4,
    },
  ],
  width: 220,
};

export const NoteNode = ({ id, data }) => {
  if (!id) {
    logger.error('NoteNode: missing required prop "id"');
    return null;
  }
  logger.debug('NoteNode render', { id });
  return <BaseNode id={id} data={data} config={NOTE_NODE_CONFIG} />;
};