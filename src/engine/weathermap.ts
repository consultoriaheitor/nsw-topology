import { COLORS } from '../styles/tokens';

// traffic value -> % of link capacity
export const getUtilizationPercent = (currentValue: number, capacity: number): number => {
  if (capacity <= 0) {
    return 0;
  }
  const percent = (currentValue / (capacity * 1e6)) * 100;
  return Math.min(Math.max(percent, 0), 200);
};

// pick color from configurable thresholds based on utilization %
export const getUtilizationColor = (
  percent: number,
  alertEnabled = true,
  warningThreshold = 90,
  criticalThreshold = 100
): string => {
  if (percent <= 0) {
    return COLORS.green;
  }

  if (!alertEnabled) {
    return COLORS.green;
  }

  const parsedWarning = Number(warningThreshold);
  const parsedCritical = Number(criticalThreshold);
  const warning = Number.isFinite(parsedWarning) && parsedWarning >= 0 ? parsedWarning : 90;
  const critical =
    Number.isFinite(parsedCritical) && parsedCritical >= warning ? parsedCritical : Math.max(warning, 100);

  if (percent >= critical) {
    return COLORS.red;
  }
  if (percent >= warning) {
    return COLORS.warning;
  }
  return COLORS.green;
};

// scale edge thickness based on utilization (up to 4x)
export const getUtilizationThickness = (percent: number, baseThickness: number): number => {
  const minMultiplier = 1;
  const maxMultiplier = 4;
  const clamped = Math.min(percent, 100);
  const multiplier = minMultiplier + ((maxMultiplier - minMultiplier) * clamped) / 100;
  return baseThickness * multiplier;
};
