/**
 * draggableNode.js
 * A draggable chip in the toolbar palette.
 * Accepts icon + color from nodeConfig for visual distinction.
 */

import logger from './utils/logger';
import './styles/draggableNode.css';

export const DraggableNode = ({ type, label, icon, color }) => {
  if (!type) {
    logger.warn('DraggableNode: "type" prop is missing');
    return null;
  }

  const onDragStart = (event) => {
    try {
      const appData = { nodeType: type };
      event.dataTransfer.setData('application/reactflow', JSON.stringify(appData));
      event.dataTransfer.effectAllowed = 'move';
      logger.debug('DraggableNode dragStart', { type });
    } catch (err) {
      logger.error('DraggableNode: dragStart failed', err);
    }
  };

  const onDragEnd = (event) => {
    event.target.style.opacity = '1';
  };

  const onDragStartStyle = (event) => {
    event.target.style.opacity = '0.6';
    onDragStart(event);
  };

  return (
    <div
      className="draggable-node"
      draggable
      onDragStart={onDragStartStyle}
      onDragEnd={onDragEnd}
      data-type={type}
      title={`Drag to add ${label} node`}
    >
      {/* Colored accent bar on left */}
      <span
        className="draggable-node__accent"
        style={{ backgroundColor: color || '#6366f1' }}
      />
      {icon && <span className="draggable-node__icon">{icon}</span>}
      <span className="draggable-node__label">{label || type}</span>
    </div>
  );
};