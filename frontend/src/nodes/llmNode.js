/**
 * llmNode.js
 * Represents a Large Language Model call in the pipeline.
 * Refactored to use BaseNode — now has real fields instead of
 * a static "This is a LLM" label.
 */

import { BaseNode } from './BaseNode';
import { NODE_COLORS } from '../constants/nodeConfig';
import logger from '../utils/logger';

const LLM_NODE_CONFIG = {
  title: 'LLM',
  color: NODE_COLORS.llm,
  inputs: [
    { id: 'system',  label: 'system'  },
    { id: 'prompt',  label: 'prompt'  },
    { id: 'context', label: 'context' },
  ],
  outputs: [
    { id: 'response', label: 'response' },
  ],
  fields: [
    {
      key: 'model',
      label: 'Model',
      type: 'select',
      defaultValue: 'gpt-4o',
      options: [
        { value: 'gpt-4o',              label: 'GPT-4o' },
        { value: 'gpt-4o-mini',         label: 'GPT-4o Mini' },
        { value: 'claude-3-5-sonnet',   label: 'Claude 3.5 Sonnet' },
        { value: 'claude-3-haiku',      label: 'Claude 3 Haiku' },
        { value: 'gemini-1.5-pro',      label: 'Gemini 1.5 Pro' },
      ],
    },
    {
      key: 'temperature',
      label: 'Temperature',
      type: 'number',
      defaultValue: 0.7,
      placeholder: '0.0 – 1.0',
    },
    {
      key: 'streamResponse',
      label: 'Stream response',
      type: 'toggle',
      defaultValue: false,
    },
  ],
  width: 240,
};

export const LLMNode = ({ id, data }) => {
  if (!id) {
    logger.error('LLMNode: missing required prop "id"');
    return null;
  }

  const config = {
    ...LLM_NODE_CONFIG,
    fields: LLM_NODE_CONFIG.fields.map((field) => ({
      ...field,
      defaultValue: data?.[field.key] ?? field.defaultValue,
    })),
  };

  logger.debug('LLMNode render', { id });

  return <BaseNode id={id} data={data} config={config} />;
};