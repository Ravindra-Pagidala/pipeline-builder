/**
 * ResultModal.jsx
 * Displays pipeline analysis results from the backend.
 * ALL hooks called unconditionally before any early return.
 */

import { useEffect, useCallback } from 'react';
import './ResultModal.css';

// ── DAG status helper ─────────────────────────────────────────
function getDAGStatus(isDAG, numNodes, numEdges) {
  if (numNodes === 0) {
    return {
      type:    'empty',
      icon:    '◎',
      label:   'Empty Pipeline',
      message: 'No nodes found on the canvas. Add nodes and connect them to build a pipeline.',
      color:   '#a09b96',
      bg:      '#f5f4f2',
      border:  '#e0ddd8',
    };
  }

  if (numNodes > 0 && numEdges === 0) {
    return {
      type:    'isolated',
      icon:    '◈',
      label:   'No Connections',
      message: `${numNodes} node${numNodes > 1 ? 's' : ''} on the canvas but no edges connecting them. Connect nodes to form a pipeline flow.`,
      color:   '#6b7280',
      bg:      '#f9fafb',
      border:  '#d1d5db',
    };
  }

  if (isDAG) {
    return {
      type:    'dag',
      icon:    '✓',
      label:   'Valid Pipeline',
      message: 'This pipeline is a Directed Acyclic Graph — data flows in one direction with no circular dependencies. It is safe to execute.',
      color:   '#059669',
      bg:      '#ecfdf5',
      border:  '#6ee7b7',
    };
  }

  return {
    type:    'cycle',
    icon:    '⟳',
    label:   'Cycle Detected',
    message: 'This pipeline contains a circular dependency — at least one node eventually connects back to itself. Pipelines must be acyclic (no loops) to execute correctly. Remove the circular connection to fix this.',
    color:   '#d97706',
    bg:      '#fffbeb',
    border:  '#fcd34d',
  };
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ value, label, accent }) {
  return (
    <div className="result-modal__stat" style={{ '--accent': accent }}>
      <span className="result-modal__stat-value">{value}</span>
      <span className="result-modal__stat-label">{label}</span>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────
export function ResultModal({ result, onClose }) {
  // ── ALL hooks first — before any conditional return ───────────

  // Derive safe values before hooks so they're always stable
  const nodeCount = typeof result?.num_nodes === 'number' ? result.num_nodes : 0;
  const edgeCount = typeof result?.num_edges === 'number' ? result.num_edges : 0;
  const dagResult = typeof result?.is_dag    === 'boolean' ? result.is_dag   : false;

  const safeOnClose = typeof onClose === 'function' ? onClose : () => {};

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => { if (e.key === 'Escape') safeOnClose(); },
    [safeOnClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Early return AFTER all hooks ──────────────────────────────
  if (!result) return null;

  const status = getDAGStatus(dagResult, nodeCount, edgeCount);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) safeOnClose();
  };

  return (
    <div
      className="result-modal__backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-modal-title"
    >
      <div className="result-modal__panel">

        {/* ── Header ── */}
        <div className="result-modal__header">
          <span className="result-modal__header-label">Pipeline Analysis</span>
          <button
            className="result-modal__close"
            onClick={safeOnClose}
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* ── Stats row ── */}
        <div className="result-modal__stats">
          <StatCard
            value={nodeCount}
            label={nodeCount === 1 ? 'Node' : 'Nodes'}
            accent="#5b4fff"
          />
          <div className="result-modal__stats-divider" />
          <StatCard
            value={edgeCount}
            label={edgeCount === 1 ? 'Connection' : 'Connections'}
            accent="#0891b2"
          />
        </div>

        {/* ── DAG result card ── */}
        <div
          className="result-modal__dag-card"
          style={{ background: status.bg, borderColor: status.border }}
        >
          <div className="result-modal__dag-icon" style={{ color: status.color }}>
            {status.icon}
          </div>
          <div className="result-modal__dag-body">
            <p
              className="result-modal__dag-label"
              id="result-modal-title"
              style={{ color: status.color }}
            >
              {status.label}
            </p>
            <p className="result-modal__dag-message">{status.message}</p>
          </div>
        </div>

        {/* ── What is a DAG? — collapsible ── */}
        <details className="result-modal__explainer">
          <summary className="result-modal__explainer-toggle">
            What is a DAG?
          </summary>
          <div className="result-modal__explainer-body">
            <p>
              A <strong>Directed Acyclic Graph</strong> is a graph where edges
              have direction (A → B) and there are no cycles — you can never
              follow edges and return to your starting node.
            </p>
            <div className="result-modal__cases">
              <div className="result-modal__case result-modal__case--valid">
                <span className="result-modal__case-icon">✓</span>
                <div>
                  <strong>Valid DAG:</strong> Input → Text → LLM → Output
                  <br />
                  <span>Data flows in one direction, no loops.</span>
                </div>
              </div>
              <div className="result-modal__case result-modal__case--invalid">
                <span className="result-modal__case-icon">⟳</span>
                <div>
                  <strong>Not a DAG:</strong> A → B → C → A
                  <br />
                  <span>Node A connects back to itself — circular dependency.</span>
                </div>
              </div>
            </div>
          </div>
        </details>

        {/* ── Close button ── */}
        <button
          className="result-modal__btn"
          onClick={safeOnClose}
          type="button"
        >
          Done
        </button>

      </div>
    </div>
  );
}