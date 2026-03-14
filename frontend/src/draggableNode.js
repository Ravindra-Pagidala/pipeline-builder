/**
 * draggableNode.js
 * Horizontal toolbar chip — icon + label, pill shape.
 * Lifts on hover like a physical key being pressed.
 */

import logger from './utils/logger';
import './styles/draggableNode.css';

export const DraggableNode = ({ type, label, icon, color }) => {
  if (!type) { logger.warn('DraggableNode: type missing'); return null; }

  const onDragStart = (event) => {
    try {
      event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType: type }));
      event.dataTransfer.effectAllowed = 'move';
    } catch (err) { logger.error('DraggableNode: dragStart failed', err); }
  };

  return (
    <div
      className="draggable-node"
      draggable
      onDragStart={onDragStart}
      onDragEnd={(e) => { e.target.style.opacity = '1'; }}
      data-type={type}
      title={`Drag to add ${label}`}
      style={{ '--node-color': color }}
    >
      <span className="draggable-node__icon">{icon}</span>
      <span className="draggable-node__label">{label}</span>
    </div>
  );
};