/**
 * nodeConfig.js
 * Central registry for all node type definitions.
 * Add a new node here + create its file — that's it.
 */

export const NODE_COLORS = {
  customInput:   '#4f46e5',
  customOutput:  '#059669',
  llm:           '#d97706',
  text:          '#2563eb',
  filter:        '#db2777',
  math:          '#7c3aed',
  note:          '#ea580c',
  transform:     '#0891b2',
  delay:         '#64748b',
};

export const NODE_CATEGORIES = {
  General: ['customInput', 'customOutput', 'text'],
  LLMs:    ['llm'],
  Logic:   ['filter', 'math', 'transform'],
  Utility: ['note', 'delay'],
};

export const NODE_LABELS = {
  customInput:  'Input',
  customOutput: 'Output',
  llm:          'LLM',
  text:         'Text',
  filter:       'Filter',
  math:         'Math',
  note:         'Note',
  transform:    'Transform',
  delay:        'Delay',
};

export const NODE_ICONS = {
  customInput:  '⬇',
  customOutput: '⬆',
  llm:          '🤖',
  text:         '📝',
  filter:       '🔍',
  math:         '➗',
  note:         '🗒',
  transform:    '🔄',
  delay:        '⏱',
};