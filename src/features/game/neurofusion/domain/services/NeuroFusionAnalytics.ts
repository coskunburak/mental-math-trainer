import { neuroFusionEvents } from '@core/analytics/events';
import type { AnalyticsParams } from '@core/analytics/AnalyticsClient';
import { AnalyticsService } from '@core/analytics/AnalyticsService';
import type {
  NeuroFusionBeatAccuracy,
  NeuroFusionChallengeItem,
  NeuroFusionGrade,
  NeuroFusionModeVariant,
  NeuroFusionPhaseType,
  NeuroFusionPreset,
  NeuroFusionRunState,
} from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';

export class NeuroFusionAnalytics {
  constructor(private readonly analytics: AnalyticsService) {}

  trackScreenView(screenName: string): void {
    this.analytics.track('screen_view', {
      screen_name: screenName,
      feature: 'neuro_fusion',
    });
  }

  trackUiTap(action: string, context: AnalyticsParams = {}): void {
    this.analytics.track('ui_tap', {
      feature: 'neuro_fusion',
      action,
      ...context,
    });
  }

  trackRunStart(input: {
    bpm: number;
    preset: NeuroFusionPreset;
    seed: number;
    trackId: string;
    modeVariant: NeuroFusionModeVariant;
  }): void {
    this.emitBusinessAction(neuroFusionEvents.runStart, {
      bpm: input.bpm,
      difficulty: input.preset,
      seed: input.seed,
      track_id: input.trackId,
      mode_variant: input.modeVariant,
    });
  }

  trackPhaseStart(phaseType: NeuroFusionPhaseType, index: number): void {
    this.emitBusinessAction(neuroFusionEvents.phaseStart, {
      phase_type: phaseType,
      index,
    });
  }

  trackQuestionAnswered(input: {
    phaseType: NeuroFusionPhaseType;
    item: NeuroFusionChallengeItem;
    difficultyTier: number;
    isCorrect: boolean;
    responseTimeMs: number;
    beatAccuracy: NeuroFusionBeatAccuracy;
    combo: number;
    flow: number;
  }): void {
    const itemMeta = itemTaxonomy(input.item);

    this.emitBusinessAction(neuroFusionEvents.questionAnswered, {
      phase_type: input.phaseType,
      operation_type: itemMeta.operationType,
      puzzle_type: itemMeta.puzzleType,
      difficulty_tier: input.difficultyTier,
      is_correct: input.isCorrect,
      response_time_ms: input.responseTimeMs,
      beat_accuracy: input.beatAccuracy,
      combo: input.combo,
      flow: input.flow,
    });
  }

  trackRunEnd(state: NeuroFusionRunState): void {
    if (!state.summary) {
      return;
    }

    this.emitBusinessAction(neuroFusionEvents.runEnd, {
      score: state.summary.score,
      accuracy: Math.round(state.summary.accuracy * 1000) / 1000,
      avg_beat_offset_ms: state.summary.avgBeatOffsetMs,
      best_combo: state.summary.bestCombo,
      phase_breakdown: compactPhaseBreakdown(state),
      grade: state.summary.grade,
    });
  }

  trackRewardClaimed(tier: NeuroFusionGrade, rewardType: string): void {
    this.emitBusinessAction(neuroFusionEvents.rewardClaimed, {
      tier,
      reward_type: rewardType,
    });
  }

  trackCalibrationCompleted(offsetMs: number, stdDevMs: number): void {
    this.emitBusinessAction(neuroFusionEvents.calibrationCompleted, {
      offset_ms: offsetMs,
      std_dev_ms: stdDevMs,
    });
  }

  private emitBusinessAction(action: string, params: AnalyticsParams): void {
    this.analytics.track('business_action', {
      action,
      feature: 'neuro_fusion',
      ...params,
    });

    this.analytics.track(action, params);
  }
}

function itemTaxonomy(item: NeuroFusionChallengeItem): {
  operationType: string;
  puzzleType: string;
} {
  if (item.kind === 'rhythm_question') {
    return {
      operationType: item.operationType,
      puzzleType: 'none',
    };
  }

  if (item.kind === 'puzzle') {
    return {
      operationType: 'puzzle',
      puzzleType: item.puzzleType,
    };
  }

  if (item.kind === 'memory_stack') {
    return {
      operationType: 'echo_stack',
      puzzleType: 'none',
    };
  }

  return {
    operationType: 'reflex_gate',
    puzzleType: 'none',
  };
}

function compactPhaseBreakdown(state: NeuroFusionRunState): string {
  const breakdown = state.summary?.phaseBreakdown ?? state.phaseBreakdown;
  const parts = Object.entries(breakdown).map(([phase, stats]) => `${phase}:${stats.score}/${stats.correct}/${stats.total}`);
  return parts.join('|').slice(0, 180);
}
