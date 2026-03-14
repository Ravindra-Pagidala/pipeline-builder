"""
main.py — Pipeline Studio Backend
Run: uvicorn main:app --reload
"""

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import logging
import sys

# ── Logger ─────────────────────────────────────────────────────
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("pipeline_studio")


# ── Pydantic models ─────────────────────────────────────────────

class PipelineNode(BaseModel):
    id:   str
    type: Optional[str]            = None
    data: Optional[Dict[str, Any]] = None


class PipelineEdge(BaseModel):
    id:           str
    source:       str
    target:       str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class PipelineRequest(BaseModel):
    nodes: List[PipelineNode] = Field(default_factory=list)
    edges: List[PipelineEdge] = Field(default_factory=list)


class PipelineResponse(BaseModel):
    num_nodes: int
    num_edges: int
    is_dag:    bool


# ── DAG detection ───────────────────────────────────────────────
# Three-colour DFS (WHITE/GRAY/BLACK).
# A back-edge to a GRAY node means a cycle exists → not a DAG.
# We iterate over ALL nodes as potential DFS roots so disconnected
# components are also checked correctly.

WHITE, GRAY, BLACK = 0, 1, 2

def check_is_dag(node_ids: List[str], edge_pairs: List[tuple]) -> bool:
    """
    Returns True if the directed graph is acyclic (a DAG).
    Returns False if any cycle exists.
    Handles: empty graphs, single nodes, disconnected components,
             self-loops (A→A), and multi-node cycles (A→B→C→A).
    """
    if not node_ids:
        logger.info("DAG check: empty graph → is DAG")
        return True

    try:
        node_set = set(node_ids)

        # Build adjacency list — skip edges referencing unknown nodes
        adjacency: Dict[str, List[str]] = {n: [] for n in node_ids}
        for source, target in edge_pairs:
            if source in node_set and target in node_set:
                adjacency[source].append(target)
            else:
                logger.warning(
                    "DAG check: skipping edge %s→%s (node not found)", source, target
                )

        colour: Dict[str, int] = {n: WHITE for n in node_ids}

        def dfs(node: str) -> bool:
            """Returns True if a cycle is detected."""
            colour[node] = GRAY
            for neighbour in adjacency[node]:
                if colour[neighbour] == GRAY:
                    logger.info("DAG check: cycle via %s → %s", node, neighbour)
                    return True
                if colour[neighbour] == WHITE:
                    if dfs(neighbour):
                        return True
            colour[node] = BLACK
            return False

        # Visit every unvisited node — handles disconnected graphs
        for node_id in node_ids:
            if colour[node_id] == WHITE:
                if dfs(node_id):
                    return False

        logger.info("DAG check: no cycles found → is DAG")
        return True

    except RecursionError:
        logger.error("DAG check: recursion limit hit — treating as non-DAG")
        return False
    except Exception as exc:
        logger.error("DAG check: unexpected error — %s", exc, exc_info=True)
        return False


# ── FastAPI app ─────────────────────────────────────────────────

app = FastAPI(
    title="Pipeline Studio API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled error on %s %s — %s", request.method, request.url, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error."},
    )


@app.get("/")
def read_root():
    return {"status": "ok", "service": "Pipeline Studio API"}


@app.post("/pipelines/parse", response_model=PipelineResponse)
def parse_pipeline(payload: PipelineRequest) -> PipelineResponse:
    try:
        logger.info(
            "parse_pipeline: %d nodes, %d edges",
            len(payload.nodes), len(payload.edges),
        )

        num_nodes = len(payload.nodes)
        num_edges = len(payload.edges)

        node_ids = [n.id for n in payload.nodes]
        edge_pairs = [
            (e.source, e.target)
            for e in payload.edges
            if e.source and e.target
        ]

        graph_is_dag = check_is_dag(node_ids, edge_pairs)

        logger.info(
            "parse_pipeline: result nodes=%d edges=%d is_dag=%s",
            num_nodes, num_edges, graph_is_dag,
        )

        return PipelineResponse(
            num_nodes=num_nodes,
            num_edges=num_edges,
            is_dag=graph_is_dag,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("parse_pipeline error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to analyse pipeline.") from exc