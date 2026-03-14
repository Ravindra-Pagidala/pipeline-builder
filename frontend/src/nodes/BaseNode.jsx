/**
 * BaseNode.jsx
 * Core abstraction — every node renders through this component.
 *
 * Config shape:
 * {
 *   title:     string           required
 *   color:     string           hex color for header
 *   nameKey:   string|null      field key whose value shows in header
 *   inputs:    [{id, label}]    left-side target handles
 *   outputs:   [{id, label}]    right-side source handles
 *   fields:    [FieldDef]       form fields in body
 *   width:     number           default 220
 *   minHeight: number|'auto'    default 'auto'
 * }
 *
 * Extra props:
 *   extraContent  ReactNode  rendered inside body (TextNode textarea)
 *   handles       ReactNode  rendered at ROOT level (TextNode dynamic handles)
 *                            MUST be at root so ReactFlow positions them on edges
 */

import React, { useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { NODE_COLORS } from '../constants/nodeConfig';
import { useNodeFields } from '../hooks/useNodeFields';
import { validateNodeConfig, computeHandlePositions, makeHandleId } from '../utils/nodeUtils';
import logger from '../utils/logger';
import './BaseNode.css';

// ─── Field renderer ───────────────────────────────────────────

function FieldRenderer({ field, value, onChange }) {
  if (!field?.key) {
    logger.warn('FieldRenderer: invalid field', field);
    return null;
  }

  const handleChange = (e) => {
    const val = field.type === 'toggle' ? e.target.checked : e.target.value;
    onChange(field.key, val);
  };

  switch (field.type) {
    case 'textarea':
      return (
        <div className="base-node__field">
          {field.label && <label className="base-node__label">{field.label}</label>}
          <textarea
            className="base-node__textarea nodrag"
            value={value ?? field.defaultValue ?? ''}
            onChange={handleChange}
            placeholder={field.placeholder || ''}
            rows={field.rows || 3}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
      );

    case 'select':
      return (
        <div className="base-node__field">
          {field.label && <label className="base-node__label">{field.label}</label>}
          <select
            className="base-node__select nodrag"
            value={value ?? field.defaultValue ?? ''}
            onChange={handleChange}
          >
            {(field.options || []).map((opt) => {
              const { value: v, label: l } =
                typeof opt === 'string' ? { value: opt, label: opt } : opt;
              return <option key={v} value={v}>{l}</option>;
            })}
          </select>
        </div>
      );

    case 'number':
      return (
        <div className="base-node__field">
          {field.label && <label className="base-node__label">{field.label}</label>}
          <input
            className="base-node__input nodrag"
            type="number"
            value={value ?? field.defaultValue ?? 0}
            onChange={handleChange}
            placeholder={field.placeholder || ''}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
      );

    case 'toggle':
      return (
        <div className="base-node__field base-node__field--row">
          <span className="base-node__label">{field.label}</span>
          <label className="base-node__toggle">
            <input
              type="checkbox"
              checked={!!(value ?? field.defaultValue ?? false)}
              onChange={handleChange}
            />
            <span className="base-node__toggle-slider" />
          </label>
        </div>
      );

    default: // 'text'
      return (
        <div className="base-node__field">
          {field.label && <label className="base-node__label">{field.label}</label>}
          <input
            className="base-node__input nodrag"
            type="text"
            value={value ?? field.defaultValue ?? ''}
            onChange={handleChange}
            placeholder={field.placeholder || ''}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
      );
  }
}

// ─── BaseNode ─────────────────────────────────────────────────

export const BaseNode = ({ id, data, config, extraContent, handles }) => {
  // ── Derive safe values BEFORE any hook ────────────────────────
  const safeConfig = config && typeof config === 'object' ? config : {};
  const title      = safeConfig.title     ?? 'Node';
  const color      = safeConfig.color     ?? NODE_COLORS.text;
  const nameKey    = safeConfig.nameKey   ?? null;
  const inputs     = Array.isArray(safeConfig.inputs)  ? safeConfig.inputs  : [];
  const outputs    = Array.isArray(safeConfig.outputs) ? safeConfig.outputs : [];
  const fields     = Array.isArray(safeConfig.fields)  ? safeConfig.fields  : [];
  const width      = safeConfig.width     ?? 220;
  const minHeight  = safeConfig.minHeight ?? 'auto';

  // Build initialValues from field defaults + any existing data
  const initialValues = fields.reduce((acc, field) => {
    if (field?.key !== undefined) {
      acc[field.key] = data?.[field.key] ?? field.defaultValue ?? '';
    }
    return acc;
  }, {});

  // ── Hooks (all before any return) ─────────────────────────────
  const { values, handleChange } = useNodeFields(id, initialValues);

  useEffect(() => {
    if (!config) {
      logger.error(`BaseNode [${id}]: config is null`);
      return;
    }
    try {
      validateNodeConfig(config);
      logger.debug(`BaseNode [${id}] mounted`);
    } catch (err) {
      logger.error(`BaseNode [${id}] invalid config`, err);
    }
  }, [id, config]);

  // ── Early return AFTER all hooks ──────────────────────────────
  if (!config) {
    return (
      <div className="base-node base-node--error">
        <span>⚠ Node config missing</span>
      </div>
    );
  }

  // Use fixed pixel offsets from top instead of percentages.
  // Percentages of node height land in the middle of body fields.
  // Fixed px keeps handles near the header zone, never in body content.
  const HANDLE_START_PX = 28;  // px from top for first handle
  const HANDLE_STEP_PX  = 26;  // px between handles

  // We still need computeHandlePositions for the case where
  // only 1 handle exists (center it at 50%)
  const inputPositions  = inputs.length  === 1 ? ['50%'] :
    inputs.map((_,i)  => `${HANDLE_START_PX + i * HANDLE_STEP_PX}px`);
  const outputPositions = outputs.length === 1 ? ['50%'] :
    outputs.map((_,i) => `${HANDLE_START_PX + i * HANDLE_STEP_PX}px`);

  // Header label: use the user-edited name field if nameKey is set,
  // otherwise fall back to the ReactFlow node id
  const headerLabel = (nameKey && values?.[nameKey]) || id;

  return (
    <div className="base-node" style={{ width, "--node-accent-color": color }} data-node-id={id}>

      {/* ── Header ── */}
      <div className="base-node__header">
        <div className="base-node__header-left">
          <span className="base-node__dot" style={{ background: color }} />
          <span className="base-node__title">{title}</span>
        </div>
        <span className="base-node__id">{headerLabel}</span>
      </div>

      {/* ── Body ── */}
      <div className="base-node__body">
        {fields.length === 0 && !extraContent && (
          <p className="base-node__empty">No configuration needed.</p>
        )}
        {fields.map((field) => {
          if (!field?.key) return null;
          return (
            <FieldRenderer
              key={field.key}
              field={field}
              value={values[field.key]}
              onChange={handleChange}
            />
          );
        })}
        {extraContent}
      </div>

      {/* ── Static input handles (left edge) ── */}
      {inputs.map((handle, i) => {
        if (!handle?.id) return null;
        return (
          <React.Fragment key={handle.id}>
            <Handle
              type="target"
              position={Position.Left}
              id={makeHandleId(id, handle.id)}
              style={{ top: inputPositions[i], zIndex: 50, pointerEvents: 'all' }}
              className="base-node__handle base-node__handle--input"
            />
            <span
              className="base-node__handle-chip base-node__handle-chip--left"
              style={{ top: inputPositions[i] }}
            >{handle.label || handle.id}</span>
          </React.Fragment>
        );
      })}

      {/* ── Static output handles (right edge) ── */}
      {outputs.map((handle, i) => {
        if (!handle?.id) return null;
        return (
          <React.Fragment key={handle.id}>
            <Handle
              type="source"
              position={Position.Right}
              id={makeHandleId(id, handle.id)}
              style={{ top: outputPositions[i], zIndex: 50, pointerEvents: 'all' }}
              className="base-node__handle base-node__handle--output"
            />
            <span
              className="base-node__handle-chip base-node__handle-chip--right"
              style={{ top: outputPositions[i] }}
            >{handle.label || handle.id}</span>
          </React.Fragment>
        );
      })}

      {/* ── Dynamic handles slot (TextNode) — rendered at root level ── */}
      {handles}

    </div>
  );
};

export default BaseNode;