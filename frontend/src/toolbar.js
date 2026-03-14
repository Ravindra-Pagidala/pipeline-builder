/**
 * toolbar.js
 * Horizontal node palette strip — like Figma/Sketch.
 * Categories displayed inline with separators.
 */

import { useState } from 'react';
import { DraggableNode } from './draggableNode';
import { NODE_CATEGORIES, NODE_LABELS, NODE_ICONS, NODE_COLORS } from './constants/nodeConfig';
import logger from './utils/logger';
import './styles/toolbar.css';

export const PipelineToolbar = () => {
  const [search, setSearch] = useState('');

  const filterNodes = (types) => {
    if (!search.trim()) return types;
    return types.filter((type) =>
      (NODE_LABELS[type] || type).toLowerCase().includes(search.toLowerCase())
    );
  };

  logger.debug('PipelineToolbar render');

  return (
    <div className="app__node-strip">

      {/* Search */}
      <div className="toolbar__search-wrap">
        <input
          className="toolbar__search"
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="app__strip-sep" />

      {/* All categories inline */}
      {Object.entries(NODE_CATEGORIES).map(([category, types], catIdx) => {
        const filtered = filterNodes(types);
        if (filtered.length === 0) return null;

        return (
          <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="app__strip-label">{category}</span>
            {filtered.map((type) => (
              <DraggableNode
                key={type}
                type={type}
                label={NODE_LABELS[type] || type}
                icon={NODE_ICONS[type]}
                color={NODE_COLORS[type]}
              />
            ))}
            {catIdx < Object.entries(NODE_CATEGORIES).length - 1 && (
              <div className="app__strip-sep" />
            )}
          </div>
        );
      })}
    </div>
  );
};