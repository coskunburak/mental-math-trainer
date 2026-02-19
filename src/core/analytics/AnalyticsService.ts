import type { AnalyticsClient, AnalyticsParams } from './AnalyticsClient';

export class AnalyticsService {
  constructor(private readonly client: AnalyticsClient) {}

  track(eventName: string, params?: AnalyticsParams): void {
    this.client.track(eventName, params);
  }
}
