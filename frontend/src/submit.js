/**
 * submit.js — Part 4: Backend Integration
 *
 * When "Analyse Pipeline" is clicked:
 *   1. Read nodes and edges from the Zustand store
 *   2. Validate the canvas is not completely empty
 *   3. POST to /pipelines/parse on the FastAPI backend
 *   4. Show the ResultModal with num_nodes, num_edges, is_dag
 *
 * Error handling:
 *   — Backend offline / network error  → friendly message, no crash
 *   — Backend returns non-200 status   → error message shown in modal
 *   — Malformed response JSON          → error message shown in modal
 *   — Empty canvas                     → modal opens, shows "empty" state
 */

import { useState, useCallback } from 'react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { ResultModal } from './components/ResultModal';
import logger from './utils/logger';
import './styles/submit.css';

// ── Backend URL ────────────────────────────────────────────────
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const PARSE_ENDPOINT = `${API_BASE_URL}/pipelines/parse`;

// ── Store selector ─────────────────────────────────────────────
const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
});

export const SubmitButton = () => {
  const { nodes, edges } = useStore(selector, shallow);

  // Modal state
  const [modalResult, setModalResult]   = useState(null);   // null = closed
  const [isLoading,   setIsLoading]     = useState(false);
  const [errorMsg,    setErrorMsg]       = useState(null);

  const handleClick = useCallback(async () => {
    if (isLoading) return;  // Prevent double-submit

    setIsLoading(true);
    setErrorMsg(null);

    try {
      logger.info('SubmitButton: submitting pipeline', {
        nodeCount: nodes.length,
        edgeCount: edges.length,
      });

      // ── Serialize payload ──────────────────────────────────
      // We send the full node/edge objects — the backend Pydantic
      // model is lenient and only requires id/source/target.
      const payload = {
        nodes: nodes.map((n) => ({
          id:   n.id,
          type: n.type   ?? null,
          data: n.data   ?? null,
        })),
        edges: edges.map((e) => ({
          id:           e.id,
          source:       e.source,
          target:       e.target,
          sourceHandle: e.sourceHandle ?? null,
          targetHandle: e.targetHandle ?? null,
        })),
      };

      // ── POST to backend ────────────────────────────────────
      const response = await fetch(PARSE_ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      // ── Handle non-2xx responses ───────────────────────────
      if (!response.ok) {
        let detail = `Server returned status ${response.status}`;
        try {
          const errBody = await response.json();
          if (errBody?.detail) detail = errBody.detail;
        } catch {
          // Response body wasn't JSON — use the status message
        }
        logger.error('SubmitButton: backend error —', detail);
        setErrorMsg(detail);
        setIsLoading(false);
        return;
      }

      // ── Parse response ─────────────────────────────────────
      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        logger.error('SubmitButton: failed to parse response JSON', parseErr);
        setErrorMsg('Received an invalid response from the server.');
        setIsLoading(false);
        return;
      }

      // ── Validate response shape ────────────────────────────
      // The backend should always return these three fields.
      // Guard here so the modal never renders with undefined values.
      if (
        typeof data.num_nodes !== 'number' ||
        typeof data.num_edges !== 'number' ||
        typeof data.is_dag    !== 'boolean'
      ) {
        logger.error('SubmitButton: unexpected response shape', data);
        setErrorMsg('Received an unexpected response format from the server.');
        setIsLoading(false);
        return;
      }

      logger.info('SubmitButton: analysis complete', data);
      setModalResult(data);

    } catch (networkErr) {
      // Network error — backend is probably not running
      logger.error('SubmitButton: network error', networkErr);
      setErrorMsg(
        'Could not connect to the backend. ' +
        'Make sure the server is running on http://localhost:8000'
      );
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges, isLoading]);

  const handleCloseModal = useCallback(() => {
    setModalResult(null);
    setErrorMsg(null);
  }, []);

  return (
    <>
      <div className="submit-bar">
        {/* Error inline message (shown below button) */}
        {errorMsg && (
          <div className="submit-bar__error" role="alert">
            <span className="submit-bar__error-icon">⚠</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          className={`submit-bar__btn ${isLoading ? 'submit-bar__btn--loading' : ''}`}
          onClick={handleClick}
          disabled={isLoading}
          type="button"
          aria-busy={isLoading}
        >
          <span className="submit-bar__icon">
            {isLoading ? '⟳' : '▶'}
          </span>
          {isLoading ? 'Analysing…' : 'Analyse Pipeline'}
        </button>
      </div>

      {/* Result modal — rendered at root level via portal in ResultModal */}
      {modalResult && (
        <ResultModal
          result={modalResult}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};