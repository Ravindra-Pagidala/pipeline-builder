/**
 * nodeConfig.js
 * Central registry for all node type definitions.
 * Add a new node here + create its file — that's it.
 */

export const NODE_COLORS = {
  customInput:   '#6366f1', // indigo
  customOutput:  '#10b981', // emerald
  llm:           '#f59e0b', // amber
  text:          '#3b82f6', // blue
  filter:        '#ec4899', // pink
  math:          '#8b5cf6', // violet
  note:          '#f97316', // orange
  transform:     '#14b8a6', // teal
  delay:         '#64748b', // slate
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