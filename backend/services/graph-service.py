"""
services/graph_service.py
DAG detection logic — isolated from the FastAPI layer so it can be
unit-tested independently.

Algorithm: DFS with three-colour marking (WHITE / GRAY / BLACK).
  WHITE = not yet visited
  GRAY  = currently in the DFS stack (visiting its descendants)
  BLACK = fully processed (all descendants visited)

A cycle exists if and only if we encounter a GRAY node during DFS.
This handles all cases correctly:
  ✅ Simple cycle:        A → B → A
  ✅ Self-loop:           A → A
  ✅ Disconnected graph:  A → B   and   C → D (separate components)
  ✅ Empty graph:         no nodes, no edges  → IS a DAG (trivially)
  ✅ Single node:         one node, no edges  → IS a DAG
  ✅ Long chain:          A → B → C → D      → IS a DAG
"""

from typing import Dict, List, Set
from utils.logger import get_logger

logger = get_logger(__name__)

# ── Node colouring constants ─────────────────────────────────────
WHITE = 0  # Not visited
GRAY  = 1  # In current DFS path (ancestor)
BLACK = 2  # Fully visited


def is_dag(node_ids: List[str], edges: List[tuple]) -> bool:
    """
    Determines whether the directed graph described by `node_ids`
    and `edges` is a Directed Acyclic Graph (DAG).

    Args:
        node_ids: List of all node id strings.
        edges:    List of (source_id, target_id) tuples.

    Returns:
        True  — if the graph is a DAG (no cycles).
        False — if the graph contains at least one cycle.

    Raises:
        No exceptions are raised — all errors are logged and the
        function returns False (conservative: treat errors as cycles).
    """
    if not node_ids:
        logger.info("graph_service.is_dag: empty graph — trivially a DAG")
        return True

    try:
        # Build adjacency list from edge tuples
        # Only include nodes that actually exist in node_ids for safety
        node_set: Set[str]            = set(node_ids)
        adjacency: Dict[str, List[str]] = {nid: [] for nid in node_ids}

        for source, target in edges:
            if source not in node_set:
                logger.warning(
                    "graph_service.is_dag: edge source '%s' not in node list — skipping",
                    source,
                )
                continue
            if target not in node_set:
                logger.warning(
                    "graph_service.is_dag: edge target '%s' not in node list — skipping",
                    target,
                )
                continue
            adjacency[source].append(target)

        # Three-colour DFS
        colour: Dict[str, int] = {nid: WHITE for nid in node_ids}

        def dfs(node: str) -> bool:
            """
            Returns True if a cycle is detected starting from `node`.
            """
            colour[node] = GRAY

            for neighbour in adjacency.get(node, []):
                if colour[neighbour] == GRAY:
                    # Back edge found — cycle detected
                    logger.info(
                        "graph_service.is_dag: cycle detected via edge %s → %s",
                        node,
                        neighbour,
                    )
                    return True
                if colour[neighbour] == WHITE:
                    if dfs(neighbour):
                        return True

            colour[node] = BLACK
            return False

        # Visit every node as a potential DFS root.
        # This is CRITICAL for disconnected graphs — if we only start
        # from one root we miss cycles in disconnected components.
        for node_id in node_ids:
            if colour[node_id] == WHITE:
                if dfs(node_id):
                    return False  # Cycle found → NOT a DAG

        logger.info("graph_service.is_dag: no cycles found — graph is a DAG")
        return True

    except RecursionError:
        # Python default recursion limit ~1000. For very large pipelines
        # this could trigger. Treat as non-DAG (safe default).
        logger.error(
            "graph_service.is_dag: recursion limit hit — pipeline too large. "
            "Returning False (not a DAG) as safe default."
        )
        return False

    except Exception as exc:  # pylint: disable=broad-except
        logger.error(
            "graph_service.is_dag: unexpected error — %s. Returning False.",
            exc,
            exc_info=True,
        )
        return False