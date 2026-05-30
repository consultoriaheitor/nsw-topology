// panel options (saved in dashboard JSON)
export interface TopologyOptions {
  general: GeneralConfig;
  nodes: NodeConfig[];
  connections: ConnectionConfig[];
  valueMappings?: ValueMapping[];
  appearance: AppearanceConfig;
  colors: ColorsConfig;
  interaction: InteractionConfig;
}

export interface GeneralConfig {
  title: string;
  titleSize: number;
}

export type ThresholdOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';

export type ValueMappingType = 'value' | 'range' | 'regex';
export type ValueMappingAlertState = 'none' | 'warning' | 'alert';
export type ConnectionLineMode = 'dynamic' | 'custom';
export type NodeMode = 'monitored' | 'static';

export interface ValueMappingEntry {
  id: string;
  value?: string;
  from?: number;
  to?: number;
  pattern?: string;
  text: string;
  color?: string;
  alertState?: ValueMappingAlertState;
}

export interface ValueMapping {
  id: string;
  name: string;
  type: ValueMappingType;
  entries: ValueMappingEntry[];
}

// custom metric config — supports regex matching, thresholds, grafana units etc
export interface CustomMetric {
  id: string;
  name: string;
  icon?: string;
  field: string;
  isRegex: boolean;
  aggregation: string;
  unit: string;
  enabled: boolean;
  alertThreshold: number;
  alertCondition?: ThresholdOperator;
  alertColor: string;
  decimals: number;
  valueMappingId?: string;
  isDefault?: boolean;
}

// legacy metric config (kept for old dashboard compat)
export interface MetricConfig {
  field: string;
  enabled: boolean;
  alertThreshold: number;
  alertColor: string;
}

// single node on the topology canvas
export interface NodeConfig {
  id: string;
  name: string;
  nodeMode?: NodeMode;
  hostName: string;
  metricHostName?: string;
  icon: string;
  ip: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  pingField: string;
  pingOnlineValue: number;
  uptimeField: string;
  bgColor: string;
  iconColor: string;
  textColor: string;
  textSize: number;
  iconSize: number;
  cpuMetric: MetricConfig;
  memoryMetric: MetricConfig;
  lossMetric: MetricConfig;
  responseTimeMetric: MetricConfig;
  customMetrics?: CustomMetric[];
}

// connection between two nodes — traffic data, style, metrics
export interface ConnectionConfig {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle: string;
  targetHandle: string;
  capacity: number;
  interfaceName: string;
  alias: string;
  lineStyle: string;
  lineMode?: ConnectionLineMode;
  lineOffset?: number;
  animated: boolean;
  showTraffic: boolean;
  hideLabel?: boolean;
  capacityAlertEnabled?: boolean;
  capacityWarningThreshold?: number;
  capacityCriticalThreshold?: number;
  convertBits?: boolean;
  downloadField: string;
  uploadField: string;
  unit?: string;
  customMetrics?: CustomMetric[];
}

export interface AppearanceConfig {
  bgColor: string;
  showGrid: boolean;
  gridSize: number;
  gridColor: string;
  showLinkLabels: boolean;
}

export interface ColorsConfig {
  online: string;
  offline: string;
  alert: string;
}

export interface InteractionConfig {
  enableZoom: boolean;
  enablePan: boolean;
  showMiniMap: boolean;
  showLegend: boolean;
}

// single metric from a zabbix interface (in/out traffic etc)
export interface ZabbixInterfaceMetric {
  value: number | string;
  units: string;
  itemid: string;
}

export interface ZabbixInterfaceData {
  [metricName: string]: ZabbixInterfaceMetric;
}

// host data parsed from grafana data frames
export interface ZabbixHost {
  name: string;
  ip: string;
  ping: number | string;
  loss: number | string;
  latency: number | string;
  interfaces: Record<string, ZabbixInterfaceData>;
  items: Record<string, number | string>;
}

// parser output
export interface ParsedMetrics {
  hosts: Record<string, ZabbixHost>;
  fieldNames: string[];
  hostNames: string[];
  hostFieldMap: Record<string, string[]>;
}
