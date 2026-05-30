import React, { memo } from 'react';
import { Handle, Position, NodeResizeControl, type NodeProps, type Node } from '@xyflow/react';
import { getIconDataUriColored } from '../icons';
import { COLORS, FONT } from '../../styles/tokens';

export type MetricDisplay = {
  label: string;
  value: string;
  color: string;
  alerting: boolean;
};

export type ConnectionDisplay = {
  name: string;
  color: string;
};

export type TopologyNodeData = {
  label: string;
  ip: string;
  icon: string;
  statusColor: string;
  status: string;
  uptimeValue: string;
  connections: ConnectionDisplay[];
  metrics: MetricDisplay[];
  bgColor: string;
  iconColor: string;
  textColor: string;
  textSize: number;
  iconSize: number;
  width: number;
  height: number;
  isEditing: boolean;
};

type TopologyNodeType = Node<TopologyNodeData, 'topology'>;

const handleStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  background: COLORS.accent,
  border: '2px solid rgba(255,255,255,0.3)',
  borderRadius: '50%',
  cursor: 'crosshair',
  zIndex: 10,
  opacity: 0.6,
};

const hiddenHandleStyle: React.CSSProperties = {
  ...handleStyle,
  opacity: 0,
  pointerEvents: 'none',
};

export const TopologyNode = memo(({ data, selected }: NodeProps<TopologyNodeType>) => {
  const { label, icon, statusColor, textSize, iconSize, isEditing } = data;
  const iconUri = getIconDataUriColored(icon, COLORS.textWhite);
  const currentHandleStyle = isEditing ? handleStyle : hiddenHandleStyle;

  return (
    <>
      {isEditing && (
        <NodeResizeControl
          position="bottom-right"
          minWidth={80}
          minHeight={60}
          style={{ background: 'transparent', border: 'none', width: 14, height: 14, cursor: 'se-resize' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ display: 'block' }}>
            <path
              d="M9 1v8H1"
              fill="none"
              stroke={selected ? COLORS.textWhite : 'rgba(255,255,255,0.4)'}
              strokeWidth="1.5"
            />
            <path
              d="M9 5v4H5"
              fill="none"
              stroke={selected ? COLORS.textWhite : 'rgba(255,255,255,0.4)'}
              strokeWidth="1.5"
            />
          </svg>
        </NodeResizeControl>
      )}

      <Handle type="source" position={Position.Top} id="top" style={currentHandleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={currentHandleStyle} />
      <Handle type="source" position={Position.Left} id="left" style={currentHandleStyle} />
      <Handle type="source" position={Position.Right} id="right" style={currentHandleStyle} />

      <div
        style={{
          width: '100%',
          height: '100%',
          minWidth: 80,
          minHeight: 60,
          background: statusColor,
          borderRadius: 10,
          border: '2px solid rgba(255,255,255,0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: `0 0 18px ${statusColor}44, 0 4px 12px rgba(0,0,0,0.3)`,
          transition: 'background 0.35s ease, box-shadow 0.35s ease',
          position: 'relative',
          gap: 4,
          padding: '8px 6px',
          cursor: isEditing ? 'grab' : 'default',
        }}
      >
        <img
          src={iconUri}
          alt={label}
          style={{ width: iconSize || 32, height: iconSize || 32, objectFit: 'contain' }}
          draggable={false}
        />

        <div
          style={{
            fontSize: textSize || FONT.label,
            fontWeight: 600,
            color: data.textColor || COLORS.textWhite,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            lineHeight: 1.2,
            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}
        >
          {label}
        </div>
      </div>
    </>
  );
});

TopologyNode.displayName = 'TopologyNode';
