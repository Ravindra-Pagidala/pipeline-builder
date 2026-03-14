/**
 * textNode.js
 * Text node with dynamic variables and AUTO-CONNECTION
 * When user selects a node from {{ dropdown → edge is created automatically
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

const MIN_WIDTH = 240;
const MAX_WIDTH = 520;
const MIN_HEIGHT = 120;
const CHAR_WIDTH = 7.5;
const LINE_HEIGHT = 22;
const BODY_PADDING = 80;

function getNodeDisplayName(node) {
  return (
    node?.data?.inputName ||
    node?.data?.outputName ||
    node?.data?.name ||
    node?.id ||
    ''
  );
}

/* ───────────────────────────────────────────── */
/* Dropdown rendered in document.body (portal)  */
/* ───────────────────────────────────────────── */

function NodeDropdown({ items, dropdownRef, onSelect, anchorRef }) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 240 });

  useEffect(() => {
    if (!anchorRef?.current) return;

    const rect = anchorRef.current.getBoundingClientRect();

    setPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 200),
    });
  }, [anchorRef]);

  return ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 99999,
        background: '#1a1d27',
        border: '1px solid #6366f1',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      <div className="text-node__dropdown-header">Select a node</div>

      {items.length === 0 ? (
        <div className="text-node__dropdown-empty">
          No nodes available
        </div>
      ) : (
        items.map((item) => (
          <button
            key={item.id}
            className="text-node__dropdown-item"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(item.displayName);
            }}
          >
            <span className="text-node__dropdown-type">{item.type}</span>
            <span className="text-node__dropdown-id">{item.displayName}</span>
          </button>
        ))
      )}
    </div>,
    document.body
  );
}

/* ───────────────────────────────────────────── */
/* TextNode                                      */
/* ───────────────────────────────────────────── */

export const TextNode = ({ id, data }) => {
  const safeId = id ?? '__invalid_textnode__';
  const initialText = data?.text ?? '';

  const { values, handleChange } = useNodeFields(safeId, { text: initialText });

  const text = values.text ?? '';

  const [variables, setVariables] = useState(() =>
    extractVariables(initialText)
  );

  const [dimensions, setDimensions] = useState({
    width: MIN_WIDTH,
    height: MIN_HEIGHT,
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownFilter, setDropdownFilter] = useState('');

  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  const allNodes = useStore(
    useCallback(
      (state) =>
        state.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          data: n.data,
          displayName: getNodeDisplayName(n),
        })),
      []
    )
  );

  const addEdgeDirectly = useStore((state) => state.addEdgeDirectly);

  /* ───────────────────────── */
  /* Resize node dynamically   */
  /* ───────────────────────── */

  const recalcSize = useCallback((value) => {
    if (!value) {
      setDimensions({ width: MIN_WIDTH, height: MIN_HEIGHT });
      return;
    }

    const lines = value.split('\n');
    const longest = Math.max(...lines.map((l) => l.length));

    setDimensions({
      width: Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, longest * CHAR_WIDTH + 48)
      ),
      height: Math.max(
        MIN_HEIGHT,
        lines.length * LINE_HEIGHT + BODY_PADDING
      ),
    });
  }, []);

  /* ───────────────────────── */
  /* Handle typing in textarea */
  /* ───────────────────────── */

  const onTextChange = useCallback(
    (e) => {
      const value = e.target.value;
      const cursor = e.target.selectionStart;

      handleChange('text', value);

      setVariables(extractVariables(value));
      recalcSize(value);

      const beforeCursor = value.slice(0, cursor);
      const match = beforeCursor.match(/\{\{([^}]*)$/);

      if (match) {
        setDropdownFilter(match[1] ?? '');
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    },
    [handleChange, recalcSize]
  );

  /* ───────────────────────── */
  /* Insert node + auto-connect */
  /* ───────────────────────── */

  const insertNodeName = useCallback(
    (displayName) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursor = textarea.selectionStart;

      const before = text.slice(0, cursor);
      const after = text.slice(cursor);

      const newBefore = before.replace(
        /\{\{[^}]*$/,
        `{{${displayName}}}`
      );

      const newText = newBefore + after;

      handleChange('text', newText);
      setVariables(extractVariables(newText));
      recalcSize(newText);
      setShowDropdown(false);

      /* 🔥 AUTO EDGE CREATION */

      const sourceNode = allNodes.find(
        (n) => n.displayName === displayName
      );

      if (sourceNode) {
        addEdgeDirectly({
          source: sourceNode.id,
          sourceHandle: makeHandleId(sourceNode.id, 'value'),
          target: id,
          targetHandle: makeHandleId(id, displayName),
        });
      }

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(
          newBefore.length,
          newBefore.length
        );
      });
    },
    [text, handleChange, recalcSize, allNodes, id, addEdgeDirectly]
  );

  /* ───────────────────────── */

  useEffect(() => {
    recalcSize(initialText);
    setVariables(extractVariables(initialText));
  }, []);

  /* ───────────────────────── */

  const availableNodes = allNodes.filter(
    (n) =>
      n.id !== id &&
      n.displayName
        .toLowerCase()
        .includes(dropdownFilter.toLowerCase())
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
          style={{
            top: `${handleTopPercents[i]}%`,
            width: '14px',
            height: '14px',
            background: '#6366f1',
            border: '2px solid #0f1117',
            borderRadius: '50%',
            pointerEvents: 'all',
            zIndex: 50,
          }}
        />
      ))}

      <Handle
        type="source"
        position={Position.Right}
        id={makeHandleId(id, 'output')}
        style={{
          top: '50%',
          width: '14px',
          height: '14px',
          background: '#6366f1',
          border: '2px solid #0f1117',
          borderRadius: '50%',
          pointerEvents: 'all',
          zIndex: 50,
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
          placeholder="Type text… use {{ to reference a node"
          spellCheck={false}
          style={{
            width: '100%',
            height: Math.max(60, dimensions.height - BODY_PADDING),
            resize: 'none',
          }}
        />

        {showDropdown && (
          <NodeDropdown
            items={availableNodes}
            dropdownRef={dropdownRef}
            onSelect={insertNodeName}
            anchorRef={textareaRef}
          />
        )}
      </div>

      {variables.length > 0 && (
        <div className="text-node__var-list">
          <span className="base-node__label">
            Connected inputs
          </span>

          {variables.map((v) => (
            <div key={v} className="text-node__var-row">
              <span className="text-node__var-dot" />
              <span className="text-node__var-pill">
                {`{{${v}}}`}
              </span>
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
        title: 'Text',
        color: NODE_COLORS.text,
        inputs: [],
        outputs: [],
        fields: [],
        width: dimensions.width,
        minHeight: dimensions.height,
      }}
      extraContent={extraContent}
      handles={dynamicHandles}
    />
  );
};