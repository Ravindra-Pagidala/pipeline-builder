/**
 * store.js
 * Zustand global store.
 *
 * Key action: syncTextNodeEdges
 * ─────────────────────────────
 * Called every time the TextNode textarea changes.
 * Receives the TextNode's id + the CURRENT list of variables.
 * In a single atomic set() call it:
 *   1. Removes all edges whose target is this TextNode AND whose
 *      targetHandle is NOT in the current variable list
 *      (handles deleted variables).
 *   2. Optionally adds a new edge when a new variable was just
 *      selected from the dropdown.
 *
 * This is atomic — no stale closure or ref issues because the
 * store function always reads get().edges (the live value).
 */

import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';
import logger from './utils/logger';

const EDGE_STYLE = {
  type:      'smoothstep',
  animated:  true,
  markerEnd: {
    type:   MarkerType.ArrowClosed,
    width:  16,
    height: 16,
    color:  '#6366f1',
  },
  style: { stroke: '#6366f1', strokeWidth: 1.5 },
};

// Build the targetHandle id for a TextNode variable
// Must match makeHandleId(id, varName) in nodeUtils
function textTargetHandle(nodeId, varName) {
  return `${nodeId}-${varName}`;
}

export const useStore = create((set, get) => ({
  nodes:   [],
  edges:   [],
  nodeIDs: {},

  // ── ID generation ─────────────────────────────────────────────
  getNodeID: (type) => {
    if (!type) {
      logger.error('store.getNodeID: type required');
      return `unknown-${Date.now()}`;
    }
    const newIDs = { ...get().nodeIDs };
    newIDs[type] = (newIDs[type] ?? 0) + 1;
    set({ nodeIDs: newIDs });
    const id = `${type}-${newIDs[type]}`;
    logger.debug('store.getNodeID', { type, id });
    return id;
  },

  // ── Add node ──────────────────────────────────────────────────
  addNode: (node) => {
    if (!node?.id || !node?.type) {
      logger.error('store.addNode: node must have id and type', node);
      return;
    }
    set({ nodes: [...get().nodes, node] });
    logger.info('store.addNode', { id: node.id, type: node.type });
  },

  // ── Node changes (includes deletion + edge cleanup) ───────────
  onNodesChange: (changes) => {
    try {
      const updatedNodes = applyNodeChanges(changes, get().nodes);

      const removedIds = new Set(
        changes.filter((c) => c.type === 'remove').map((c) => c.id)
      );

      const updatedEdges = removedIds.size > 0
        ? get().edges.filter(
            (e) => !removedIds.has(e.source) && !removedIds.has(e.target)
          )
        : get().edges;

      set({ nodes: updatedNodes, edges: updatedEdges });

      if (removedIds.size > 0) {
        logger.info('store.onNodesChange: removed nodes + orphaned edges', {
          removedIds: [...removedIds],
        });
      }
    } catch (err) {
      logger.error('store.onNodesChange: failed', err);
    }
  },

  // ── Edge changes ──────────────────────────────────────────────
  onEdgesChange: (changes) => {
    try {
      set({ edges: applyEdgeChanges(changes, get().edges) });
    } catch (err) {
      logger.error('store.onEdgesChange: failed', err);
    }
  },

  // ── Manual drag connection ─────────────────────────────────────
  onConnect: (connection) => {
    if (!connection?.source || !connection?.target) {
      logger.warn('store.onConnect: incomplete connection', connection);
      return;
    }
    try {
      set({ edges: addEdge({ ...connection, ...EDGE_STYLE }, get().edges) });
      logger.debug('store.onConnect', connection);
    } catch (err) {
      logger.error('store.onConnect: failed', err);
    }
  },

  // ── Field sync ────────────────────────────────────────────────
  updateNodeField: (nodeId, fieldName, fieldValue) => {
    if (!nodeId || !fieldName) {
      logger.warn('store.updateNodeField: nodeId and fieldName required');
      return;
    }
    set({
      nodes: get().nodes.map((node) =>
        node.id !== nodeId
          ? node
          : { ...node, data: { ...node.data, [fieldName]: fieldValue } }
      ),
    });
  },

  // ── ATOMIC edge sync for TextNode ─────────────────────────────
  //
  // Called every time the TextNode textarea changes.
  //
  // @param textNodeId  string        — the TextNode's ReactFlow id
  // @param currentVars string[]      — variables currently in the text
  // @param newEdge     object|null   — if a new variable was just picked:
  //   { newVar, sourceNodeId, sourceHandle, targetHandle }
  //
  // What it does in ONE set() call:
  //   Step 1 — Remove edges that target this TextNode whose
  //            targetHandle is NOT in the currentVars list
  //            (these belong to deleted variables)
  //   Step 2 — If newEdge provided, add it (no duplicate check
  //            needed because step 1 already removed old version)
  syncTextNodeEdges: (textNodeId, currentVars, newEdge = null) => {
    if (!textNodeId) return;

    try {
      // Build the set of valid targetHandle ids for current variables
      const validHandles = new Set(
        currentVars.map((v) => textTargetHandle(textNodeId, v))
      );

      // Step 1: keep all edges EXCEPT stale ones targeting this TextNode
      let updatedEdges = get().edges.filter((e) => {
        // Keep edges that don't target this TextNode
        if (e.target !== textNodeId) return true;
        // For edges that DO target this TextNode,
        // keep only those whose targetHandle is still valid
        return validHandles.has(e.targetHandle);
      });

      // Step 2: add the new edge if provided
      if (newEdge) {
        const { sourceNodeId, sourceHandle, targetHandle } = newEdge;

        // Check if this exact edge already exists after step 1 cleanup
        const alreadyExists = updatedEdges.some(
          (e) =>
            e.source       === sourceNodeId &&
            e.target       === textNodeId   &&
            e.sourceHandle === sourceHandle &&
            e.targetHandle === targetHandle
        );

        if (!alreadyExists) {
          const connection = {
            source:       sourceNodeId,
            sourceHandle: sourceHandle,
            target:       textNodeId,
            targetHandle: targetHandle,
          };
          updatedEdges = addEdge({ ...connection, ...EDGE_STYLE }, updatedEdges);
          logger.info('store.syncTextNodeEdges: edge added', connection);
        }
      }

      set({ edges: updatedEdges });

      logger.debug('store.syncTextNodeEdges', {
        textNodeId,
        currentVars,
        edgeCount: updatedEdges.length,
      });
    } catch (err) {
      logger.error('store.syncTextNodeEdges: failed', err);
    }
  },

  // ── Clear canvas ──────────────────────────────────────────────
  clearCanvas: () => {
    set({ nodes: [], edges: [], nodeIDs: {} });
    logger.info('store.clearCanvas');
  },
}));