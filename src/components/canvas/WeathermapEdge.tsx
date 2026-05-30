import React, { memo, useState } from 'react';
import { getValueFormat, formattedValueToString } from '@grafana/data';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps, type Edge } from '@xyflow/react';
import {
  COLORS,
  FONT,
  Z_INDEX,
  tooltipBox,
  tooltipDivider,
  tooltipLabel,
  tooltipRow,
  statusDot,
} from '../../styles/tokens';

export type TrafficHistoryPoint = { time: number; dl: number; ul: number };

export type WeathermapEdgeData = {
  label: string;
  edgeColor: string;
  edgeWidth: number;
  lineStyle: string;
  hasTraffic: boolean;
  animated: boolean;
  showTraffic: boolean;
  hideLabel: boolean;
  sourceName: string;
  targetName: string;
  sourceStatus: string;
  targetStatus: string;
  downloadValue: string;
  uploadValue: string;
  interfaceName: string;
  trafficHistory: TrafficHistoryPoint[];
  isRed: boolean;
  capacity: number;
  utilizationPercent: number;
  capacityAlertEnabled: boolean;
  capacityWarningThreshold: number;
  capacityCriticalThreshold: number;
  customMetrics?: any[];
  parallelCount?: number;
  parallelOffset?: number;
};

type WeathermapEdgeType = Edge<WeathermapEdgeData, 'weathermap'>;

const formatAxisValue = (bps: number): string => {
  if (bps >= 1e9) {
    return `${(bps / 1e9).toFixed(1)}G`;
  }
  if (bps >= 1e6) {
    return `${(bps / 1e6).toFixed(0)}M`;
  }
  if (bps >= 1e3) {
    return `${(bps / 1e3).toFixed(0)}K`;
  }
  return `${bps.toFixed(0)}`;
};

const formatCapacityGbps = (capacityMbps: number): string => {
  const gbps = (capacityMbps || 0) / 1000;
  return `${Number.isInteger(gbps) ? gbps.toFixed(0) : gbps.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')} Gbps`;
};

const getCubicPoint = (
  t: number,
  sourceX: number,
  sourceY: number,
  control1X: number,
  control1Y: number,
  control2X: number,
  control2Y: number,
  targetX: number,
  targetY: number
) => {
  const mt = 1 - t;
  return {
    x: mt ** 3 * sourceX + 3 * mt ** 2 * t * control1X + 3 * mt * t ** 2 * control2X + t ** 3 * targetX,
    y: mt ** 3 * sourceY + 3 * mt ** 2 * t * control1Y + 3 * mt * t ** 2 * control2Y + t ** 3 * targetY,
  };
};

const getCurvedEdgePath = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: EdgeProps<WeathermapEdgeType>['sourcePosition'],
  targetPosition: EdgeProps<WeathermapEdgeType>['targetPosition'],
  offset: number
): [string, number, number] => {
  if (Math.abs(offset) < 1) {
    const [path, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });
    return [path, labelX, labelY];
  }

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.hypot(dx, dy);
  if (!length) {
    const [path, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });
    return [path, labelX, labelY];
  }

  const normalX = -dy / length;
  const normalY = dx / length;
  const control1X = sourceX + dx * 0.35 + normalX * offset;
  const control1Y = sourceY + dy * 0.35 + normalY * offset;
  const control2X = sourceX + dx * 0.65 + normalX * offset;
  const control2Y = sourceY + dy * 0.65 + normalY * offset;
  const labelPoint = getCubicPoint(0.5, sourceX, sourceY, control1X, control1Y, control2X, control2Y, targetX, targetY);

  return [
    `M${sourceX},${sourceY} C${control1X},${control1Y} ${control2X},${control2Y} ${targetX},${targetY}`,
    labelPoint.x,
    labelPoint.y,
  ];
};

const formatEdgeMetricValue = (metric: any): string => {
  if (metric.displayValue) {
    return metric.displayValue;
  }
  if (metric.unit && metric.unit !== 'none') {
    const fmt = getValueFormat(metric.unit);
    return formattedValueToString(fmt(metric.computedValue, metric.decimals ?? 1));
  }
  return metric.computedValue.toFixed(metric.decimals ?? 1);
};

const getEdgeMetricColor = (metric: any): string => {
  if (metric.displayColor) {
    return metric.displayColor;
  }
  const alerting = metric.alerting ?? metric.computedValue > metric.alertThreshold;
  return alerting ? metric.alertColor || COLORS.danger : COLORS.textWhite;
};

const Sparkline: React.FC<{ data: TrafficHistoryPoint[]; height: number; capacity: number }> = ({
  data,
  height,
  capacity,
}) => {
  if (!data || data.length < 2) {
    return (
      <div style={{ color: COLORS.textMuted, fontSize: FONT.sm, textAlign: 'center', padding: 4 }}>
        Sem dados históricos
      </div>
    );
  }

  const capacityBps = capacity * 1e6;
  const maxTraffic = Math.max(...data.map((d) => Math.max(d.dl, d.ul)), 1);
  const yMax = Math.max(capacityBps, maxTraffic) * 1.1;

  const leftMargin = 42;
  const chartWidth = 100;

  const gridLines = [0.25, 0.5, 0.75, 1.0].map((pct) => ({
    bps: capacityBps * pct,
    y: 100 - ((capacityBps * pct) / yMax) * 100,
    label: formatAxisValue(capacityBps * pct),
  }));

  const capacityY = 100 - (capacityBps / yMax) * 100;

  const dlPoints = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * chartWidth;
      const y = 100 - (d.dl / yMax) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  const ulPoints = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * chartWidth;
      const y = 100 - (d.ul / yMax) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div style={{ position: 'relative', width: '100%', height, display: 'flex' }}>
      <div
        style={{
          width: leftMargin,
          height: '100%',
          position: 'relative',
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        {gridLines.map((g, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              right: 3,
              top: `${g.y}%`,
              transform: 'translateY(-50%)',
              fontSize: FONT.xs,
              color: COLORS.textMuted,
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {g.label}
          </div>
        ))}
        <div
          style={{
            position: 'absolute',
            right: 3,
            bottom: 0,
            fontSize: FONT.xs,
            color: COLORS.textMuted,
            lineHeight: 1,
          }}
        >
          0
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 -2 ${chartWidth} 104`}
          preserveAspectRatio="none"
          style={{ display: 'block' }}
        >
          {gridLines.map((g, idx) => (
            <line
              key={idx}
              x1="0"
              y1={g.y}
              x2={chartWidth}
              y2={g.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <line
            x1="0"
            y1="100"
            x2={chartWidth}
            y2="100"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="0"
            y1={capacityY}
            x2={chartWidth}
            y2={capacityY}
            stroke={COLORS.trafficCapacity}
            strokeWidth="1"
            strokeDasharray="4,3"
            vectorEffect="non-scaling-stroke"
            opacity={0.6}
          />
          <polyline
            points={dlPoints}
            fill="none"
            stroke={COLORS.trafficDownload}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            opacity={0.9}
          />
          <polyline
            points={ulPoints}
            fill="none"
            stroke={COLORS.trafficUpload}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            opacity={0.9}
          />
        </svg>
      </div>
    </div>
  );
};

export const WeathermapEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    style,
    source,
    target,
  }: EdgeProps<WeathermapEdgeType>) => {
    const [hovered, setHovered] = useState(false);

    const edgeColor = data?.edgeColor || '#4b5563';
    const edgeWidth = data?.edgeWidth || 2;
    const lineStyle = data?.lineStyle || 'solid';
    const label = data?.label || '';
    const interfaceName = data?.interfaceName || '';
    const tooltipLabelText = label || interfaceName;
    const animated = data?.animated ?? false;
    const showTraffic = data?.showTraffic ?? false;
    const hideLabel = data?.hideLabel ?? false;
    const isRed = data?.isRed ?? false;
    const parallelOffset = data?.parallelOffset || 0;

    const [edgePath, labelX, labelY] = getCurvedEdgePath(
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      parallelOffset
    );

    let dashArray: string | undefined;
    if (lineStyle === 'dashed') {
      dashArray = '10 5';
    } else if (lineStyle === 'dotted') {
      dashArray = '3 5';
    }

    const shouldAnimate = animated && !isRed;
    const isDashAnimated = shouldAnimate && (lineStyle === 'dashed' || lineStyle === 'dotted');

    return (
      <>
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(edgeWidth + 14, 20)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
        />

        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            ...style,
            stroke: edgeColor,
            strokeWidth: edgeWidth,
            strokeDasharray: dashArray,
            pointerEvents: 'none',
            transition: 'stroke 0.35s ease, stroke-width 0.25s ease',
          }}
          className={isDashAnimated ? 'react-flow__edge-animated-dash' : undefined}
        />

        {shouldAnimate && lineStyle === 'solid' && (
          <>
            <circle r={3.5} fill={COLORS.textWhite} filter="url(#glow)" style={{ pointerEvents: 'none' }}>
              <animateMotion dur="2.5s" repeatCount="indefinite" path={edgePath} />
            </circle>
            <circle r={2} fill={edgeColor} style={{ pointerEvents: 'none' }}>
              <animateMotion dur="2.5s" repeatCount="indefinite" path={edgePath} />
            </circle>
          </>
        )}

        {!hideLabel && (label || (showTraffic && (data?.downloadValue || data?.uploadValue))) && (
          <EdgeLabelRenderer>
            <div
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                background: 'rgba(15,15,28,0.85)',
                border: `1px solid ${edgeColor}44`,
                color: COLORS.textWhite,
                fontSize: FONT.sm + 1,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 5,
                pointerEvents: 'auto',
                cursor: 'default',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                lineHeight: 1.3,
                zIndex: Z_INDEX.edgeLabel,
                maxWidth: 'calc(100vw - 24px)',
              }}
            >
              {label && <div>{label}</div>}
              {showTraffic && data?.downloadValue && (
                <div style={{ color: COLORS.trafficDownload, fontSize: FONT.sm, fontWeight: 500 }}>
                  ↓ {data.downloadValue}
                </div>
              )}
              {showTraffic && data?.uploadValue && (
                <div style={{ color: COLORS.trafficUpload, fontSize: FONT.sm, fontWeight: 500 }}>
                  ↑ {data.uploadValue}
                </div>
              )}
              {data?.customMetrics?.map(
                (m, idx) =>
                  m.computedValue !== null && (
                    <div
                      key={idx}
                      style={{
                        color: getEdgeMetricColor(m),
                        fontSize: FONT.sm,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      {m.icon && <span>{m.icon}</span>}
                      {formatEdgeMetricValue(m)}
                    </div>
                  )
              )}
            </div>
          </EdgeLabelRenderer>
        )}

        {hovered && (
          <EdgeLabelRenderer>
            <div
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              style={{
                ...tooltipBox,
                position: 'absolute',
                transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 24}px)`,
                pointerEvents: 'auto',
                zIndex: Z_INDEX.tooltip,
                minWidth: 220,
                maxWidth: 'calc(100vw - 24px)',
                whiteSpace: 'normal',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontWeight: 700, color: COLORS.textWhite, marginBottom: 4, fontSize: FONT.label }}>
                {data?.sourceName || source} ↔ {data?.targetName || target}
              </div>
              {tooltipLabelText && (
                <div style={tooltipRow}>
                  <span style={tooltipLabel}>Label:</span>
                  <span style={{ color: COLORS.textWhite, fontWeight: 600 }}>{tooltipLabelText}</span>
                </div>
              )}
              {interfaceName && interfaceName !== tooltipLabelText && (
                <div style={tooltipRow}>
                  <span style={tooltipLabel}>Interface:</span>
                  <span style={{ color: COLORS.textMuted }}>{interfaceName}</span>
                </div>
              )}
              <div style={tooltipDivider} />
              <div style={tooltipRow}>
                <span style={tooltipLabel}>{data?.sourceName || source}:</span>
                <span
                  style={{ color: data?.sourceStatus === 'online' ? COLORS.green : COLORS.danger, fontWeight: 600 }}
                >
                  {data?.sourceStatus === 'online' ? '● Online' : '● Offline'}
                </span>
              </div>
              <div style={tooltipRow}>
                <span style={tooltipLabel}>{data?.targetName || target}:</span>
                <span
                  style={{ color: data?.targetStatus === 'online' ? COLORS.green : COLORS.danger, fontWeight: 600 }}
                >
                  {data?.targetStatus === 'online' ? '● Online' : '● Offline'}
                </span>
              </div>
              <div style={tooltipDivider} />
              <div style={tooltipRow}>
                <span style={{ color: COLORS.trafficDownload, fontWeight: 600 }}>↓ Download:</span>
                <span style={{ color: COLORS.trafficDownload, fontWeight: 600 }}>{data?.downloadValue || '—'}</span>
              </div>
              <div style={tooltipRow}>
                <span style={{ color: COLORS.trafficUpload, fontWeight: 600 }}>↑ Upload:</span>
                <span style={{ color: COLORS.trafficUpload, fontWeight: 600 }}>{data?.uploadValue || '—'}</span>
              </div>

              <div style={tooltipRow}>
                <span style={tooltipLabel}>Capacity:</span>
                <span>{formatCapacityGbps(data?.capacity || 1000)}</span>
              </div>
              <div style={tooltipRow}>
                <span style={tooltipLabel}>Utilization:</span>
                <span style={{ color: edgeColor, fontWeight: 600 }}>{(data?.utilizationPercent || 0).toFixed(1)}%</span>
              </div>
              <div style={tooltipRow}>
                <span style={tooltipLabel}>Bandwidth alerts:</span>
                <span>
                  {data?.capacityAlertEnabled
                    ? `Warning ${data.capacityWarningThreshold}% / Critical ${data.capacityCriticalThreshold}%`
                    : 'Disabled'}
                </span>
              </div>

              {data?.customMetrics && data.customMetrics.length > 0 && (
                <>
                  <div style={tooltipDivider} />
                  {data.customMetrics.map(
                    (m, idx) =>
                      m.computedValue !== null && (
                        <div key={idx} style={tooltipRow}>
                          <span style={{ ...tooltipLabel, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {m.icon && <span>{m.icon}</span>}
                            {m.name}:
                          </span>
                          <span
                            style={{
                              color: getEdgeMetricColor(m),
                              fontWeight: 600,
                            }}
                          >
                            {formatEdgeMetricValue(m)}
                          </span>
                        </div>
                      )
                  )}
                </>
              )}

              {data?.trafficHistory && data.trafficHistory.length > 1 && (
                <>
                  <div style={tooltipDivider} />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: FONT.sm,
                      color: COLORS.textMuted,
                      marginBottom: 2,
                    }}
                  >
                    <div style={statusDot(data.isRed ? COLORS.danger : COLORS.green)} />
                    Tráfego
                  </div>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 4,
                      padding: '4px 0',
                      marginTop: 2,
                      width: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    <Sparkline data={data.trafficHistory} height={80} capacity={data.capacity || 1000} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: FONT.sm }}>
                    <span style={{ color: COLORS.trafficDownload }}>— Download</span>
                    <span style={{ color: COLORS.trafficUpload }}>— Upload</span>
                    <span style={{ color: COLORS.trafficCapacity, opacity: 0.6 }}>┈ Capacity</span>
                  </div>
                </>
              )}
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }
);

WeathermapEdge.displayName = 'WeathermapEdge';
