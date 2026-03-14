/**
 * toolbar.js
 * Categorized node palette — drag nodes from here onto the canvas.
 * Categories and labels are driven by nodeConfig constants.
 */

import { useState } from 'react';
import { DraggableNode } from './draggableNode';
import { NODE_CATEGORIES, NODE_LABELS, NODE_ICONS, NODE_COLORS } from './constants/nodeConfig';
import logger from './utils/logger';
import './styles/toolbar.css';

export const PipelineToolbar = () => {
  const [search, setSearch] = useState('');
  const [openCategory, setOpenCategory] = useState(null);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const toggleCategory = (cat) => {
    setOpenCategory((prev) => (prev === cat ? null : cat));
  };

  // Filter nodes across all categories by search term
  const filterNodes = (types) => {
    if (!search.trim()) return types;
    return types.filter((type) =>
      (NODE_LABELS[type] || type).toLowerCase().includes(search.toLowerCase())
    );
  };

  logger.debug('PipelineToolbar render');

  return (
    <aside className="toolbar">
      <div className="toolbar__header">
        <span className="toolbar__title">Nodes</span>
      </div>

      {/* Search */}
      <div className="toolbar__search-wrap">
        <input
          className="toolbar__search"
          type="text"
          placeholder="Search nodes…"
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {/* Categories */}
      <div className="toolbar__categories">
        {Object.entries(NODE_CATEGORIES).map(([category, types]) => {
          const filtered = filterNodes(types);
          // Hide empty categories during search
          if (search && filtered.length === 0) return null;

          const isOpen = search ? true : openCategory === category;

          return (
            <div key={category} className="toolbar__category">
              <button
                className={`toolbar__cat-header ${isOpen ? 'toolbar__cat-header--open' : ''}`}
                onClick={() => toggleCategory(category)}
                aria-expanded={isOpen}
              >
                <span>{category}</span>
                <span className="toolbar__cat-arrow">{isOpen ? '▴' : '▾'}</span>
              </button>

              {isOpen && (
                <div className="toolbar__nodes">
                  {filtered.map((type) => (
                    <DraggableNode
                      key={type}
                      type={type}
                      label={NODE_LABELS[type] || type}
                      icon={NODE_ICONS[type]}
                      color={NODE_COLORS[type]}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};