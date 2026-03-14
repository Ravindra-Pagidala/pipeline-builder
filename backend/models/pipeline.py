"""
models/pipeline.py
Pydantic v2 compatible models for /pipelines/parse.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ── Request models ─────────────────────────────────────────────

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


# ── Response model ─────────────────────────────────────────────

class PipelineResponse(BaseModel):
    num_nodes: int
    num_edges: int
    is_dag:    bool