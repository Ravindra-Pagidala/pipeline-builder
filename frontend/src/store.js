/**
 * store.js
 * Zustand global store — single source of truth for
 * all nodes, edges, and node ID counters.
 *
 * Exported selectors keep component subscriptions narrow
 * so only the relevant slice triggers re-renders.
 */

import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';
import logger from './utils/logger';

export const useStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────
  nodes:   [],
  edges:   [],
  nodeIDs: {},   // { [type]: count } — initialized to avoid undefined checks

  // ── Node ID generation ─────────────────────────────────────
  getNodeID: (type) => {
    if (!type) {
      logger.error('store.getNodeID: type is required');
      return `unknown-${Date.now()}`;
    }

    const newIDs = { ...get().nodeIDs };
    newIDs[type] = (newIDs[type] ?? 0) + 1;
    set({ nodeIDs: newIDs });

    const id = `${type}-${newIDs[type]}`;
    logger.debug('store.getNodeID', { type, id });
    return id;
  },

  // ── Node operations ────────────────────────────────────────
  addNode: (node) => {
    if (!node?.id || !node?.type) {
      logger.error('store.addNode: node must have id and type', node);
      return;
    }
    set({ nodes: [...get().nodes, node] });
    logger.info('store.addNode', { id: node.id, type: node.type });
  },

  onNodesChange: (changes) => {
    try {
      set({ nodes: applyNodeChanges(changes, get().nodes) });
    } catch (err) {
      logger.error('store.onNodesChange: failed to apply changes', err);
    }
  },

  onEdgesChange: (changes) => {
    try {
      set({ edges: applyEdgeChanges(changes, get().edges) });
    } catch (err) {
      logger.error('store.onEdgesChange: failed to apply changes', err);
    }
  },

  onConnect: (connection) => {
    if (!connection?.source || !connection?.target) {
      logger.warn('store.onConnect: incomplete connection', connection);
      return;
    }

    try {
      set({
        edges: addEdge(
          {
            ...connection,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type:   MarkerType.ArrowClosed,
              width:  16,
              height: 16,
              color:  '#6366f1',
            },
            style: { stroke: '#6366f1', strokeWidth: 1.5 },
          },
          get().edges
        ),
      });
      logger.debug('store.onConnect', connection);
    } catch (err) {
      logger.error('store.onConnect: failed to add edge', err);
    }
  },

  // ── Field sync ─────────────────────────────────────────────
  updateNodeField: (nodeId, fieldName, fieldValue) => {
    if (!nodeId || !fieldName) {
      logger.warn('store.updateNodeField: nodeId and fieldName are required', {
        nodeId,
        fieldName,
      });
      return;
    }

    set({
      nodes: get().nodes.map((node) => {
        if (node.id !== nodeId) return node;
        return { ...node, data: { ...node.data, [fieldName]: fieldValue } };
      }),
    });
  },

  // ── Direct edge creation (used by TextNode auto-connect) ─────
  // Called when user picks a node from the {{ dropdown.
  // source     = the picked node's id
  // sourceHandle = the picked node's output handle id
  // target     = the TextNode's id
  // targetHandle = the variable handle id on the TextNode
  addEdgeDirectly: (connection) => {
    if (!connection?.source || !connection?.target) {
      logger.warn('store.addEdgeDirectly: incomplete connection', connection);
      return;
    }
    try {
      // Don't add a duplicate edge for the same source→target handle pair
      const exists = get().edges.some(
        (e) =>
          e.source       === connection.source &&
          e.target       === connection.target &&
          e.sourceHandle === connection.sourceHandle &&
          e.targetHandle === connection.targetHandle
      );
      if (exists) {
        logger.debug('store.addEdgeDirectly: edge already exists, skipping', connection);
        return;
      }
      set({
        edges: addEdge(
          {
            ...connection,
            type:      'smoothstep',
            animated:  true,
            markerEnd: {
              type:   MarkerType.ArrowClosed,
              width:  16,
              height: 16,
              color:  '#6366f1',
            },
            style: { stroke: '#6366f1', strokeWidth: 1.5 },
          },
          get().edges
        ),
      });
      logger.info('store.addEdgeDirectly: edge added', connection);
    } catch (err) {
      logger.error('store.addEdgeDirectly: failed', err);
    }
  },

  // ── Utility ────────────────────────────────────────────────
  clearCanvas: () => {
    set({ nodes: [], edges: [], nodeIDs: {} });
    logger.info('store.clearCanvas: canvas cleared');
  },
}));