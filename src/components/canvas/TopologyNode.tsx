import React, { memo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, NodeResizeControl, type NodeProps, type Node } from '@xyflow/react';
import { getIconDataUriColored } from '../icons';
import {
  COLORS,
  FONT,
  Z_INDEX,
  tooltipBox,
  tooltipDivider,
  tooltipLabel,
  tooltipRow,
  tooltipTitle,
  statusDot,
} from '../../styles/tokens';

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

type TooltipPosition = {
  left: number;
  top: number;
  placement: 'top' | 'bottom';
};

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
  const { label, icon, statusColor, status, uptimeValue, connections, metrics, textSize, iconSize, isEditing } = data;
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const iconUri = getIconDataUriColored(icon, COLORS.textWhite);
  const currentHandleStyle = isEditing ? handleStyle : hiddenHandleStyle;

  const getTooltipPosition = (): TooltipPosition | null => {
    const rect = nodeRef.current?.getBoundingClientRect();
    if (!rect || typeof window === 'undefined') {
      return null;
    }

    const viewportWidth = window.innerWidth || rect.left + rect.width;
    const sidePadding = 12;
    const tooltipHalfWidth = Math.min(140, Math.max(96, viewportWidth / 2 - sidePadding));
    const minLeft = sidePadding + tooltipHalfWidth;
    const maxLeft = Math.max(minLeft, viewportWidth - sidePadding - tooltipHalfWidth);
    const left = Math.min(Math.max(rect.left + rect.width / 2, minLeft), maxLeft);
    const hasRoomAbove = rect.top > 160;

    return {
      left,
      top: hasRoomAbove ? rect.top - 8 : rect.bottom + 8,
      placement: hasRoomAbove ? 'top' : 'bottom',
    };
  };

  const showTooltip = () => {
    const position = getTooltipPosition();
    if (position) {
      setTooltipPosition(position);
    }
  };

  const handleNodeClick = () => {
    if (!isEditing) {
      setTooltipPosition((current) => (current ? null : getTooltipPosition()));
    }
  };

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
        ref={nodeRef}
        onMouseEnter={showTooltip}
        onMouseMove={showTooltip}
        onMouseLeave={() => setTooltipPosition(null)}
        onClick={handleNodeClick}
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
          pointerEvents: 'auto',
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

      {tooltipPosition &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: tooltipPosition.left,
              top: tooltipPosition.top,
              transform: tooltipPosition.placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
              zIndex: Z_INDEX.tooltip,
              pointerEvents: 'none',
              maxWidth: 'calc(100vw - 24px)',
              maxHeight: 'calc(100vh - 24px)',
              overflowY: 'auto',
            }}
          >
            <div style={{ ...tooltipBox, maxWidth: 'calc(100vw - 24px)', boxSizing: 'border-box' }}>
              <div style={tooltipTitle}>{label}</div>
              <div style={tooltipDivider} />
              <div style={tooltipRow}>
                <div style={statusDot(data.statusColor)} />
                <span style={tooltipLabel}>Status:</span>
                <span style={{ color: statusColor, fontWeight: 700 }}>
                  {status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              {uptimeValue && (
                <div style={tooltipRow}>
                  <span style={{ width: 8 }} />
                  <span style={tooltipLabel}>Uptime:</span>
                  <span>{uptimeValue}</span>
                </div>
              )}
              {metrics.length > 0 && (
                <>
                  <div style={tooltipDivider} />
                  <div style={{ ...tooltipLabel, marginBottom: 2 }}>Metrics:</div>
                  {metrics.map((metric, index) => (
                    <div key={index} style={tooltipRow}>
                      <div style={statusDot(metric.alerting ? metric.color : COLORS.green)} />
                      <span style={tooltipLabel}>{metric.label}:</span>
                      <span
                        style={{
                          color: metric.alerting ? metric.color : COLORS.textSecondary,
                          fontWeight: metric.alerting ? 700 : 400,
                        }}
                      >
                        {metric.value}
                        {metric.alerting && (
                          <span style={{ fontSize: FONT.sm, marginLeft: 4, color: metric.color }}>!</span>
                        )}
                      </span>
                    </div>
                  ))}
                </>
              )}
              {connections.length > 0 && (
                <>
                  <div style={tooltipDivider} />
                  <div style={{ ...tooltipLabel, marginBottom: 2 }}>Connections:</div>
                  {connections.slice(0, 5).map((connection, index) => (
                    <div key={index} style={{ ...tooltipRow, paddingLeft: 2 }}>
                      <div style={statusDot(connection.color)} />
                      <span style={{ fontSize: FONT.sm + 1, color: COLORS.textSecondary }}>{connection.name}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
});

TopologyNode.displayName = 'TopologyNode';
