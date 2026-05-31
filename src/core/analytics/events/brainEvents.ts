export const brainEvents = {
  brainScoreComputed: 'brain_score_computed',
  brainInsightGenerated: 'brain_insight_generated',
  weakAreasComputed: 'weak_areas_computed',
} as const;

export interface BrainScoreComputedEvent {
  score: number;
  speed_component: number;
  accuracy_component: number;
  hard_perf_component: number;
  confidence: number;
  window: string;
}

export interface BrainInsightGeneratedEvent {
  type: 'overall' | 'speed';
  confidence: number;
  delta_pct: number;
}

export interface WeakAreasComputedEvent {
  count: number;
  top_area_type: string;
}
