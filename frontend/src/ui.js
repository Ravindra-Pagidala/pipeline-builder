/**
 * ui.js
 * ReactFlow canvas — renders the drag-and-drop pipeline editor.
 *
 * Fix 1: Pass inputName/outputName in initial data when dropping nodes
 *        so the header shows the correct name immediately on drop.
 * Fix 4: onNodesChange also removes edges connected to deleted nodes.
 */

import { useState, useRef, useCallback } from 'react';
import ReactFlow, { Controls, Background, MiniMap } from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';

import { InputNode }     from './nodes/inputNode';
import { LLMNode }       from './nodes/llmNode';
import { OutputNode }    from './nodes/outputNode';
import { TextNode }      from './nodes/textNode';
import { FilterNode }    from './nodes/filterNode';
import { MathNode }      from './nodes/mathNode';
import { NoteNode }      from './nodes/noteNode';
import { TransformNode } from './nodes/transformNode';
import { DelayNode }     from './nodes/delayNode';

import logger from './utils/logger';
import 'reactflow/dist/style.css';
import './styles/ui.css';

const GRID_SIZE   = 20;
const PRO_OPTIONS = { hideAttribution: true };

// nodeTypes MUST be defined outside the component — if defined
// inside, ReactFlow remounts every node on each render.
const nodeTypes = {
  customInput:  InputNode,
  llm:          LLMNode,
  customOutput: OutputNode,
  text:         TextNode,
  filter:       FilterNode,
  math:         MathNode,
  note:         NoteNode,
  transform:    TransformNode,
  delay:        DelayNode,
};

// ── Default names for each node type ─────────────────────────
// These are written into node.data at drop time so the header
// shows a clean name immediately without waiting for user input.
const DEFAULT_NAME_BY_TYPE = {
  customInput:  (id) => id.replace('customInput-',  'input_'),
  customOutput: (id) => id.replace('customOutput-', 'output_'),
};

const selector = (state) => ({
  nodes:         state.nodes,
  edges:         state.edges,
  getNodeID:     state.getNodeID,
  addNode:       state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect:     state.onConnect,
});

export const PipelineUI = () => {
  const reactFlowWrapper  = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const {
    nodes, edges, getNodeID, addNode,
    onNodesChange, onEdgesChange, onConnect,
  } = useStore(selector, shallow);

  // ── Drop handler ──────────────────────────────────────────────
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      try {
        const wrapper = reactFlowWrapper.current;
        if (!wrapper || !reactFlowInstance) return;

        const rawData = event.dataTransfer.getData('application/reactflow');
        if (!rawData) return;

        const { nodeType: type } = JSON.parse(rawData);
        if (!type || !nodeTypes[type]) {
          logger.warn(`PipelineUI.onDrop: unknown type "${type}"`);
          return;
        }

        const bounds   = wrapper.getBoundingClientRect();
        const position = reactFlowInstance.project({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });

        const nodeID = getNodeID(type);

        // Build initial data — include the default name so the
        // header shows "input_1" immediately, not "customInput-1"
        const defaultNameFn = DEFAULT_NAME_BY_TYPE[type];
        const initialData   = {
          id:      nodeID,
          nodeType: type,
          ...(defaultNameFn
            ? { inputName: defaultNameFn(nodeID), outputName: defaultNameFn(nodeID) }
            : {}),
        };

        addNode({ id: nodeID, type, position, data: initialData });
        logger.info('PipelineUI: node added', { nodeID, type });
      } catch (err) {
        logger.error('PipelineUI.onDrop: error', err);
      }
    },
    [reactFlowInstance, getNodeID, addNode]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="pipeline-ui" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        proOptions={PRO_OPTIONS}
        snapGrid={[GRID_SIZE, GRID_SIZE]}
        snapToGrid
        connectionLineType="smoothstep"
        fitView
        deleteKeyCode="Delete"
        connectionRadius={30}
      >
        <Background color="#2e3347" gap={GRID_SIZE} size={1} />
        <Controls className="pipeline-ui__controls" />
        <MiniMap
          nodeColor={(node) => ({
            customInput:  '#6366f1',
            customOutput: '#10b981',
            llm:          '#f59e0b',
            text:         '#3b82f6',
            filter:       '#ec4899',
            math:         '#8b5cf6',
            note:         '#f97316',
            transform:    '#14b8a6',
            delay:        '#64748b',
          })[node.type] || '#6366f1'}
          style={{ background: '#1a1d27', border: '1px solid #2e3347' }}
        />
      </ReactFlow>
    </div>
  );
};