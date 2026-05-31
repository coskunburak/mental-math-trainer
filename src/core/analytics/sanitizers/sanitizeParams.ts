import type { AnalyticsParams } from '@core/analytics/AnalyticsClient';

import { isAllowedAnalyticsKey, isPotentialPiiValue } from './piiGuards';

const MAX_PARAMS = 32;
const MAX_STRING_LENGTH = 120;

export function sanitizeAnalyticsParams(params?: AnalyticsParams): AnalyticsParams | undefined {
  if (!params) {
    return undefined;
  }

  const result: AnalyticsParams = {};
  let accepted = 0;

  Object.entries(params).forEach(([rawKey, rawValue]) => {
    if (accepted >= MAX_PARAMS) {
      return;
    }

    const key = rawKey.trim().slice(0, 40);
    if (!isAllowedAnalyticsKey(key)) {
      return;
    }

    const sanitized = sanitizeValue(rawValue);
    if (typeof sanitized === 'undefined') {
      return;
    }

    if (isPotentialPiiValue(sanitized)) {
      return;
    }

    result[key] = sanitized;
    accepted += 1;
  });

  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizeValue(value: unknown): string | number | boolean | null | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return undefined;
    }

    return Math.round(value * 1000) / 1000;
  }

  if (typeof value === 'string') {
    return value.replace(/\s+/g, ' ').trim().slice(0, MAX_STRING_LENGTH);
  }

  return undefined;
}
