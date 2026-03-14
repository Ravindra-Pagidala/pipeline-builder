/**
 * textNode.js — Part 1 + Part 3
 *
 * Two bugs fixed:
 *
 * Bug 1 (edge deletion): variablesRef was stale — useEffect that syncs
 * it runs AFTER render, so the diff always had wrong "old" values.
 * Fix: read current variables DIRECTLY from the store's edges list
 * instead of from stale component state.
 *
 * Bug 2 (re-connect after clear): addEdgeDirectly duplicate check was
 * using targetHandle equality — edge was deleted from store but the
 * check still found it somehow (race). Fix: removeEdgesByTarget now
 * removes ALL edges to this TextNode for that variable BEFORE we
 * check for duplicates in addEdgeDirectly. The store action
 * syncTextNodeEdges handles both delete + add atomically.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Handle, Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { NODE_COLORS } from '../constants/nodeConfig';
import { extractVariables, makeHandleId } from '../utils/nodeUtils';
import { useNodeFields } from '../hooks/useNodeFields';
import { useStore } from '../store';
import logger from '../utils/logger';
import './textNode.css';

const MIN_WIDTH    = 240;
const MAX_WIDTH    = 520;
const MIN_HEIGHT   = 120;
const CHAR_WIDTH   = 7.5;
const LINE_HEIGHT  = 22;
const BODY_PADDING = 80;

const OUTPUT_HANDLE_BY_TYPE = {
  customInput:  'value',
  customOutput: null,
  llm:          'response',
  text:         'output',
  filter:       'pass',
  math:         'result',
  transform:    'output',
  delay:        'output',
  note:         null,
};

function nodeHasOutput(type) {
  return OUTPUT_HANDLE_BY_TYPE[type] != null;
}

function getSourceHandleSuffix(type) {
  return OUTPUT_HANDLE_BY_TYPE[type] ?? 'value';
}

function getNodeDisplayName(node) {
  return node?.data?.inputName
    || node?.data?.outputName
    || node?.data?.name
    || node?.id
    || '';
}

// ── Portal dropdown ───────────────────────────────────────────
function NodeDropdown({ items, dropdownRef, onSelect, anchorRef }) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 240 });

  useEffect(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 200) });
  }, [anchorRef]);

  return ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed', top: pos.top, left: pos.left, width: pos.width,
        zIndex: 99999,
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.10)',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="text-node__dropdown-header">Select a node to connect</div>
      {items.length === 0
        ? <div className="text-node__dropdown-empty">No connectable nodes on canvas</div>
        : items.map((item) => (
            <button
              key={item.id}
              className="text-node__dropdown-item"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(item);
              }}
            >
              <span className="text-node__dropdown-type">{item.type}</span>
              <span className="text-node__dropdown-id">{item.displayName}</span>
              {item.displayName !== item.id && (
                <span className="text-node__dropdown-hint">({item.id})</span>
              )}
            </button>
          ))
      }
    </div>,
    document.body
  );
}

// ── TextNode ──────────────────────────────────────────────────
export const TextNode = ({ id, data }) => {
  // ── All hooks unconditionally first ──────────────────────────
  const safeId      = id ?? '__textnode_invalid__';
  const initialText = data?.text ?? '';

  const { values, handleChange } = useNodeFields(safeId, { text: initialText });
  const text = values.text ?? '';

  const [variables,      setVariables]      = useState(() => extractVariables(initialText));
  const [dimensions,     setDimensions]     = useState({ width: MIN_WIDTH, height: MIN_HEIGHT });
  const [showDropdown,   setShowDropdown]   = useState(false);
  const [dropdownFilter, setDropdownFilter] = useState('');

  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  const allNodes = useStore(
    useCallback(
      (state) => state.nodes.map((n) => ({
        id:          n.id,
        type:        n.type,
        data:        n.data,
        displayName: getNodeDisplayName(n),
      })),
      []
    )
  );

  // Pull the two store actions we need
  const syncTextNodeEdges = useStore((state) => state.syncTextNodeEdges);

  // ── Size recalc ───────────────────────────────────────────────
  const recalcSize = useCallback((value) => {
    if (!value) { setDimensions({ width: MIN_WIDTH, height: MIN_HEIGHT }); return; }
    try {
      const lines   = value.split('\n');
      const longest = Math.max(...lines.map((l) => l.length));
      setDimensions({
        width:  Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, longest * CHAR_WIDTH + 48)),
        height: Math.max(MIN_HEIGHT, lines.length * LINE_HEIGHT + BODY_PADDING),
      });
    } catch (err) { logger.error('TextNode.recalcSize', { err }); }
  }, []);

  // ── Textarea change ───────────────────────────────────────────
  const onTextChange = useCallback((e) => {
    const value  = e.target.value;
    const cursor = e.target.selectionStart;

    handleChange('text', value);
    recalcSize(value);

    const newVars = extractVariables(value);
    setVariables(newVars);

    // Check if the user is currently mid-typing a {{ expression
    // e.g. "{{llm" — not yet closed with }}
    // If so, do NOT sync edges yet — we'd delete existing edges
    // because the incomplete {{llm doesn't extract as a variable.
    const beforeCursor  = value.slice(0, cursor);
    const isTypingVar   = /\{\{[^}]*$/.test(beforeCursor);

    if (id && !isTypingVar) {
      // Only sync when not mid-typing — safe to diff
      syncTextNodeEdges(id, newVars);
    }

    // Show/hide dropdown
    const match = isTypingVar ? beforeCursor.match(/\{\{([^}]*)$/) : null;
    if (match) {
      setDropdownFilter(match[1] ?? '');
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [handleChange, recalcSize, id, syncTextNodeEdges]);

  // ── Node selected from dropdown → insert text + create edge ───
  const onNodeSelected = useCallback((selectedNode) => {
    if (!id || !selectedNode?.id) return;

    const displayName = selectedNode.displayName;
    const textarea    = textareaRef.current;
    if (!textarea) return;

    // Insert {{displayName}} replacing the partial {{... typed so far
    const cursor    = textarea.selectionStart;
    const before    = text.slice(0, cursor);
    const after     = text.slice(cursor);
    const newBefore = before.replace(/\{\{[^}]*$/, `{{${displayName}}}`);
    const newText   = newBefore + after;

    handleChange('text', newText);
    const newVars = extractVariables(newText);
    setVariables(newVars);
    recalcSize(newText);
    setShowDropdown(false);

    // Sync edges in store — this ALSO handles the edge add
    // because syncTextNodeEdges knows which variables are new
    // and creates edges for them
    if (id) {
      syncTextNodeEdges(id, newVars, {
        newVar:        displayName,
        sourceNodeId:  selectedNode.id,
        sourceHandle:  makeHandleId(selectedNode.id, getSourceHandleSuffix(selectedNode.type)),
        targetHandle:  makeHandleId(id, displayName),
      });
    }

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newBefore.length, newBefore.length);
    });
  }, [id, text, handleChange, recalcSize, syncTextNodeEdges]);

  // ── Close dropdown on outside click ──────────────────────────
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e) => {
      if (
        dropdownRef.current  && !dropdownRef.current.contains(e.target) &&
        textareaRef.current  && !textareaRef.current.contains(e.target)
      ) setShowDropdown(false);
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [showDropdown]);

  const onKeyDown = useCallback((e) => {
    e.stopPropagation();
    if (e.key === 'Escape') setShowDropdown(false);
  }, []);

  useEffect(() => {
    recalcSize(initialText);
    setVariables(extractVariables(initialText));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Early return after all hooks ──────────────────────────────
  if (!id) { logger.error('TextNode: missing id'); return null; }

  // Only show nodes with output handles in the dropdown
  const availableNodes = allNodes.filter(
    (n) => n.id !== id &&
           nodeHasOutput(n.type) &&
           n.displayName.toLowerCase().includes(dropdownFilter.toLowerCase())
  );

  const handleTopPercents = variables.map((_, i) =>
    Math.round(((i + 1) / (variables.length + 1)) * 100)
  );

  const dynamicHandles = (
    <>
      {variables.map((varName, i) => (
        <Handle
          key={varName}
          type="target"
          position={Position.Left}
          id={makeHandleId(id, varName)}
          isConnectable={true}
          style={{
            top: `${handleTopPercents[i]}%`,
            width: '14px', height: '14px',
            background: '#6366f1', border: '2px solid #0f1117',
            borderRadius: '50%', zIndex: 50, pointerEvents: 'all',
          }}
        />
      ))}
      <Handle
        type="source"
        position={Position.Right}
        id={makeHandleId(id, 'output')}
        isConnectable={true}
        style={{
          top: '50%',
          width: '14px', height: '14px',
          background: '#6366f1', border: '2px solid #0f1117',
          borderRadius: '50%', zIndex: 50, pointerEvents: 'all',
        }}
      />
    </>
  );

  const extraContent = (
    <div className="text-node__content">
      <label className="base-node__label">Text</label>
      <div className="text-node__input-wrap">
        <textarea
          ref={textareaRef}
          className="text-node__textarea nodrag nopan"
          value={text}
          onChange={onTextChange}
          onKeyDown={onKeyDown}
          placeholder="Type text… use {{ to reference a node"
          style={{
            width: '100%',
            height: Math.max(60, dimensions.height - BODY_PADDING),
            resize: 'none', boxSizing: 'border-box',
          }}
          spellCheck={false}
        />
        {showDropdown && (
          <NodeDropdown
            items={availableNodes}
            dropdownRef={dropdownRef}
            onSelect={onNodeSelected}
            anchorRef={textareaRef}
          />
        )}
      </div>

      {variables.length > 0 && (
        <div className="text-node__var-list">
          <span className="base-node__label">Connected inputs</span>
          {variables.map((varName) => (
            <div key={varName} className="text-node__var-row">
              <span className="text-node__var-dot" />
              <span className="text-node__var-pill">{`{{${varName}}}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <BaseNode
      id={id}
      data={data}
      config={{
        title: 'Text', color: NODE_COLORS.text,
        inputs: [], outputs: [], fields: [],
        width: dimensions.width,
      }}
      extraContent={extraContent}
      handles={dynamicHandles}
    />
  );
};