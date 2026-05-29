import { formattedValueToString, getValueFormat } from '@grafana/data';
import { CustomMetric, ThresholdOperator, ValueMapping } from '../types';
import { resolveGrafanaColor } from '../constants';

export const isMetricAlerting = (value: number, metric: CustomMetric): boolean => {
  const threshold = Number(metric.alertThreshold);
  if (!Number.isFinite(threshold)) {
    return false;
  }

  const operator: ThresholdOperator = metric.alertCondition || 'gt';

  switch (operator) {
    case 'gte':
      return value >= threshold;
    case 'lt':
      return value < threshold;
    case 'lte':
      return value <= threshold;
    case 'eq':
      return value === threshold;
    case 'neq':
      return value !== threshold;
    case 'gt':
    default:
      return value > threshold;
  }
};

export const formatCustomMetricValue = (metric: CustomMetric, value: number): string => {
  const decimals = metric.decimals ?? 1;
  if (metric.unit && metric.unit !== 'none') {
    const fmt = getValueFormat(metric.unit);
    return formattedValueToString(fmt(value, decimals));
  }
  return value.toFixed(decimals);
};

const matchesExactValue = (actualValue: number, expectedValue?: string): boolean => {
  if (expectedValue === undefined || expectedValue === '') {
    return false;
  }
  const numericExpected = Number(expectedValue);
  if (Number.isFinite(numericExpected)) {
    return actualValue === numericExpected;
  }
  return String(actualValue) === expectedValue;
};

export const getMappedMetricDisplay = (
  metric: CustomMetric,
  value: number,
  valueMappings: ValueMapping[] = []
): { text: string; color?: string } => {
  const mapping = valueMappings.find((m) => m.id === metric.valueMappingId);
  if (mapping) {
    for (const entry of mapping.entries) {
      let matches = false;

      if (mapping.type === 'value') {
        matches = matchesExactValue(value, entry.value);
      } else if (mapping.type === 'range') {
        const from = Number.isFinite(entry.from) ? Number(entry.from) : Number.NEGATIVE_INFINITY;
        const to = Number.isFinite(entry.to) ? Number(entry.to) : Number.POSITIVE_INFINITY;
        matches = value >= from && value <= to;
      } else if (mapping.type === 'regex' && entry.pattern) {
        try {
          matches = new RegExp(entry.pattern, 'i').test(String(value));
        } catch {
          matches = false;
        }
      }

      if (matches) {
        return {
          text: entry.text || formatCustomMetricValue(metric, value),
          color: entry.color ? resolveGrafanaColor(entry.color) : undefined,
        };
      }
    }
  }

  return { text: formatCustomMetricValue(metric, value) };
};
