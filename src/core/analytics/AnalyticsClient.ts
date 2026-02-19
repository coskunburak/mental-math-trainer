export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

export interface AnalyticsClient {
  track(eventName: string, params?: AnalyticsParams): void;
}

export class NoopAnalyticsClient implements AnalyticsClient {
  track(_eventName: string, _params?: AnalyticsParams): void {
    // No-op for Sprint 0.
  }
}
