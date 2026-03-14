/**
 * store.js
 *
 * Critical fix: ReactFlow's addEdge() deduplicates by source+target
 * combination only — it ignores sourceHandle/targetHandle. This means
 * if you connect Node A → TextNode and then Node B → TextNode,
 * the second edge gets silently dropped as a "duplicate".
 *
 * Fix: generate explicit unique edge IDs so addEdge never deduplicates.
 * We use a custom edgeExists() check that considers all 4 fields.
 */

import { create } from 'zustand';
import {
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

// Generate a unique, deterministic edge id from its 4 endpoints.
// Using all 4 fields means two edges with different handles but same
// source/target get different IDs — ReactFlow won't deduplicate them.
function makeEdgeId(source, sourceHandle, target, targetHandle) {
  return `e__${source}__${sourceHandle}__${target}__${targetHandle}`;
}

// Check if an edge with these exact 4 endpoints already exists
function edgeExists(edges, source, sourceHandle, target, targetHandle) {
  return edges.some(
    (e) =>
      e.source       === source       &&
      e.sourceHandle === sourceHandle &&
      e.target       === target       &&
      e.targetHandle === targetHandle
  );
}

// Build a targetHandle id for a TextNode variable (matches makeHandleId)
function textTargetHandle(nodeId, varName) {
  return `${nodeId}-${varName}`;
}

export const useStore = create((set, get) => ({
  nodes:   [],
  edges:   [],
  nodeIDs: {},

  // ── ID generation ──────────────────────────────────────────────
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

  // ── Add node ───────────────────────────────────────────────────
  addNode: (node) => {
    if (!node?.id || !node?.type) {
      logger.error('store.addNode: node must have id and type', node);
      return;
    }
    set({ nodes: [...get().nodes, node] });
    logger.info('store.addNode', { id: node.id, type: node.type });
  },

  // ── Node changes (move, select, delete + edge cleanup) ─────────
  onNodesChange: (changes) => {
    try {
      const updatedNodes = applyNodeChanges(changes, get().nodes);
      const removedIds   = new Set(
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

  // ── Edge changes ───────────────────────────────────────────────
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
      const { source, sourceHandle, target, targetHandle } = connection;

      if (edgeExists(get().edges, source, sourceHandle, target, targetHandle)) {
        logger.debug('store.onConnect: duplicate, skipping');
        return;
      }

      const edge = {
        ...connection,
        id: makeEdgeId(source, sourceHandle, target, targetHandle),
        ...EDGE_STYLE,
      };

      set({ edges: [...get().edges, edge] });
      logger.debug('store.onConnect', connection);
    } catch (err) {
      logger.error('store.onConnect: failed', err);
    }
  },

  // ── Field sync ─────────────────────────────────────────────────
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

  // ── ATOMIC edge sync for TextNode ──────────────────────────────
  //
  // Called on every textarea change and on dropdown selection.
  //
  // @param textNodeId   string      — this TextNode's id
  // @param currentVars  string[]    — variables currently in the text
  // @param newEdge      object|null — edge to add for a newly selected var:
  //   { sourceNodeId, sourceHandle, targetHandle }
  //
  // In ONE set() call:
  //   1. Remove all edges targeting this TextNode whose targetHandle
  //      is not in currentVars (handles deleted variables)
  //   2. Add newEdge if provided and not duplicate
  syncTextNodeEdges: (textNodeId, currentVars, newEdge = null) => {
    if (!textNodeId) return;

    try {
      // Set of valid target handle ids based on current variable list
      const validHandles = new Set(
        currentVars.map((v) => textTargetHandle(textNodeId, v))
      );

      // Step 1: remove stale edges targeting this TextNode
      let updatedEdges = get().edges.filter((e) => {
        if (e.target !== textNodeId) return true;       // keep — not ours
        return validHandles.has(e.targetHandle);         // keep if still valid
      });

      // Step 2: add new edge if provided
      if (newEdge) {
        const { sourceNodeId, sourceHandle, targetHandle } = newEdge;

        if (!edgeExists(updatedEdges, sourceNodeId, sourceHandle, textNodeId, targetHandle)) {
          const edge = {
            id:           makeEdgeId(sourceNodeId, sourceHandle, textNodeId, targetHandle),
            source:       sourceNodeId,
            sourceHandle: sourceHandle,
            target:       textNodeId,
            targetHandle: targetHandle,
            ...EDGE_STYLE,
          };
          updatedEdges = [...updatedEdges, edge];
          logger.info('store.syncTextNodeEdges: edge added', {
            sourceNodeId, sourceHandle, textNodeId, targetHandle,
          });
        }
      }

      set({ edges: updatedEdges });

      logger.debug('store.syncTextNodeEdges done', {
        textNodeId,
        currentVars,
        totalEdges: updatedEdges.length,
        validHandles: [...validHandles],
      });
    } catch (err) {
      logger.error('store.syncTextNodeEdges: failed', err);
    }
  },

  // ── Clear canvas ───────────────────────────────────────────────
  clearCanvas: () => {
    set({ nodes: [], edges: [], nodeIDs: {} });
    logger.info('store.clearCanvas');
  },
}));