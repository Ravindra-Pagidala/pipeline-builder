/**
 * BaseNode.jsx
 * ─────────────────────────────────────────────────────────────
 * Core abstraction for all node types.
 *
 * KEY FIX: ReactFlow Handles MUST be rendered as siblings of
 * the node's root div children — NOT nested inside sub-divs —
 * so they position correctly on the node edges.
 *
 * TextNode passes its dynamic handles via the `handles` prop
 * (rendered at root level), and its textarea via `extraContent`
 * (rendered inside the body).
 *
 * Config shape:
 * {
 *   title, color,
 *   inputs:  [{ id, label }]   → left-side target handles
 *   outputs: [{ id, label }]   → right-side source handles
 *   fields:  [FieldDef]        → form fields in body
 *   width, minHeight
 * }
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

    default:
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

/**
 * @param {string}      id            ReactFlow node id
 * @param {object}      data          ReactFlow node data
 * @param {object}      config        Node configuration (see shape above)
 * @param {ReactNode}   extraContent  Extra JSX rendered inside body (TextNode textarea)
 * @param {ReactNode}   handles       Extra Handle elements rendered at ROOT level (TextNode dynamic handles)
 */
export const BaseNode = ({ id, data, config, extraContent, handles }) => {
  // ── Safe defaults — must happen before any hook ───────────────
  const safeConfig = config && typeof config === 'object' ? config : {};
  const title      = safeConfig.title     ?? 'Node';
  const color      = safeConfig.color     ?? NODE_COLORS.text;
  const inputs     = Array.isArray(safeConfig.inputs)  ? safeConfig.inputs  : [];
  const outputs    = Array.isArray(safeConfig.outputs) ? safeConfig.outputs : [];
  const fields     = Array.isArray(safeConfig.fields)  ? safeConfig.fields  : [];
  const width      = safeConfig.width     ?? 220;
  const minHeight  = safeConfig.minHeight ?? 'auto';
  // nameKey: which field value to show in the header (e.g. 'inputName')
  const nameKey    = safeConfig.nameKey   ?? null;

  // ── Hooks (all before any early return) ───────────────────────
  const initialValues = fields.reduce((acc, field) => {
    if (field?.key !== undefined) {
      acc[field.key] = data?.[field.key] ?? field.defaultValue ?? '';
    }
    return acc;
  }, {});

  const { values, handleChange } = useNodeFields(id, initialValues);

  useEffect(() => {
    if (!config) { logger.error(`BaseNode [${id}]: config missing`); return; }
    try {
      validateNodeConfig(config);
      logger.debug(`BaseNode [${id}] mounted`);
    } catch (err) {
      logger.error(`BaseNode [${id}] invalid config`, err);
    }
  }, [id, config]);

  // ── Early return after all hooks ──────────────────────────────
  if (!config) {
    return <div className="base-node base-node--error"><span>⚠ Node config missing</span></div>;
  }

  const inputPositions  = computeHandlePositions(inputs.length);
  const outputPositions = computeHandlePositions(outputs.length);

  return (
    <div className="base-node" style={{ width, minHeight }} data-node-id={id}>

      {/* ── Header ── */}
      <div className="base-node__header" style={{ backgroundColor: color }}>
        <span className="base-node__title">{title}</span>
        <span className="base-node__id">{(nameKey && values?.[nameKey]) || id}</span>
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

      {/* ── Static left handles (from config.inputs) ── */}
      {inputs.map((handle, i) => {
        if (!handle?.id) return null;
        return (
          <React.Fragment key={handle.id}>
            <Handle
              type="target"
              position={Position.Left}
              id={makeHandleId(id, handle.id)}
              style={{ top: `${inputPositions[i]}%`, zIndex: 50, pointerEvents: 'all' }}
              className="base-node__handle base-node__handle--input"
            />
            <span
              className="base-node__handle-label base-node__handle-label--left"
              style={{ top: `calc(${inputPositions[i]}% - 8px)` }}
            >
              {handle.label || handle.id}
            </span>
          </React.Fragment>
        );
      })}

      {/* ── Static right handles (from config.outputs) ── */}
      {outputs.map((handle, i) => {
        if (!handle?.id) return null;
        return (
          <React.Fragment key={handle.id}>
            <Handle
              type="source"
              position={Position.Right}
              id={makeHandleId(id, handle.id)}
              style={{ top: `${outputPositions[i]}%`, zIndex: 50, pointerEvents: 'all' }}
              className="base-node__handle base-node__handle--output"
            />
            <span
              className="base-node__handle-label base-node__handle-label--right"
              style={{ top: `calc(${outputPositions[i]}% - 8px)` }}
            >
              {handle.label || handle.id}
            </span>
          </React.Fragment>
        );
      })}

      {/* ── Dynamic handles slot (TextNode uses this) ── */}
      {/* Rendered at ROOT level so ReactFlow positions them on the edge */}
      {handles}

    </div>
  );
};

export default BaseNode;