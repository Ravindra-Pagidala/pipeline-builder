"""
utils/logger.py
Central logging configuration for the Pipeline Studio backend.
All modules import this logger — never use print() directly.
"""

import logging
import sys
from typing import Optional


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Returns a configured logger instance.

    Usage:
        from utils.logger import get_logger
        logger = get_logger(__name__)
        logger.info("Server started")
        logger.error("Something went wrong", exc_info=True)
    """
    logger = logging.getLogger(name or "pipeline_studio")

    # Only configure if no handlers attached yet (avoid duplicate logs)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.DEBUG)

        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)-8s] %(name)s — %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.DEBUG)
        logger.propagate = False

    return logger