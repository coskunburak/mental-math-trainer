import type { AnalyticsClient, AnalyticsParams } from './AnalyticsClient';
import { sanitizeAnalyticsParams } from './sanitizers/sanitizeParams';

export class AnalyticsService {
  constructor(private readonly client: AnalyticsClient) {}

  track(eventName: string, params?: AnalyticsParams): void {
    this.client.track(eventName, sanitizeAnalyticsParams(params));
  }
}
