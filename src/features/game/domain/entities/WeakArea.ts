import type { OperationType } from '@features/game/domain/entities/AnswerEvent';

export type WeakAreaReason = 'slow' | 'inaccurate' | 'both';

export interface WeakAreaEvidence {
  sampleSize: number;
  accuracy: number;
  speed: number;
  accuracyWeakZ: number;
  speedWeakZ: number;
  weaknessScore: number;
  weaknessPercentile: number;
}

export interface WeakArea {
  operationType: OperationType;
  difficultyTierRange: [number, number];
  reason: WeakAreaReason;
  evidence: WeakAreaEvidence;
}

export interface WeaknessReport {
  topWeakAreas: WeakArea[];
  recommendations: string[];
}
