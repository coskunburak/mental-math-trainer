import { clamp } from '@core/utils/clamp';
import type { AnalyticsService } from '@core/analytics/AnalyticsService';
import type {
  NeuroFusionCalibrationResult,
  NeuroFusionChallengeItem,
  NeuroFusionConfig,
  NeuroFusionModeVariant,
  NeuroFusionPreset,
  NeuroFusionProgressData,
  NeuroFusionRunState,
  NeuroFusionRunSummary,
} from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';
import { createNeuroFusionConfig } from '@features/game/neurofusion/domain/entities/NeuroFusionConfig';
import { NeuroFusionAnalytics } from '@features/game/neurofusion/domain/services/NeuroFusionAnalytics';
import { NeuroFusionRunEngine } from '@features/game/neurofusion/domain/services/NeuroFusionRunEngine';
import { CalibrateBeatOffset } from '@features/game/neurofusion/domain/usecases/CalibrateBeatOffset';
import { EndNeuroFusionRun } from '@features/game/neurofusion/domain/usecases/EndNeuroFusionRun';
import { GenerateNextItem } from '@features/game/neurofusion/domain/usecases/GenerateNextItem';
import { NextBeatTick } from '@features/game/neurofusion/domain/usecases/NextBeatTick';
import { StartNeuroFusionRun } from '@features/game/neurofusion/domain/usecases/StartNeuroFusionRun';
import { SubmitNeuroFusionAnswer } from '@features/game/neurofusion/domain/usecases/SubmitNeuroFusionAnswer';
import {
  DEFAULT_NEURO_FUSION_PROGRESS,
  NeuroFusionProgressStore,
} from '@features/game/neurofusion/data/NeuroFusionProgressStore';

export type NeuroFusionStorePhase = 'idle' | 'calibrating' | 'running' | 'finished';

interface Listener {
  (): void;
}

export interface NeuroFusionSessionConfig {
  preset: NeuroFusionPreset;
  modeVariant: NeuroFusionModeVariant;
  bpm?: number;
  seedOverride?: number;
  trackId?: string;
  configOverrides?: Partial<NeuroFusionConfig>;
}

export interface NeuroFusionStoreState {
  phase: NeuroFusionStorePhase;
  runState: NeuroFusionRunState | null;
  summary: NeuroFusionRunSummary | null;
  answerInput: string;
  lastAnswerCorrect: boolean | null;
  calibration: {
    taps: number[];
    targetTaps: number;
    result: NeuroFusionCalibrationResult | null;
  };
  progress: NeuroFusionProgressData;
}

interface NeuroFusionStoreDependencies {
  analyticsService: AnalyticsService;
  progressStore: NeuroFusionProgressStore;
  now?: () => number;
}

export class NeuroFusionStore {
  private readonly listeners = new Set<Listener>();

  private readonly engine = new NeuroFusionRunEngine();
  private readonly analytics: NeuroFusionAnalytics;
  private readonly startUseCase = new StartNeuroFusionRun(this.engine);
  private readonly tickUseCase = new NextBeatTick(this.engine);
  private readonly submitUseCase = new SubmitNeuroFusionAnswer(this.engine);
  private readonly endUseCase = new EndNeuroFusionRun(this.engine);
  private readonly generateUseCase = new GenerateNextItem(this.engine);
  private readonly calibrateUseCase = new CalibrateBeatOffset();

  private readonly now: () => number;

  private lastTrackedPhaseIndex = -1;

  private state: NeuroFusionStoreState;

  constructor(
    private readonly deps: NeuroFusionStoreDependencies,
    private readonly sessionConfig: NeuroFusionSessionConfig,
    initialProgress: NeuroFusionProgressData = DEFAULT_NEURO_FUSION_PROGRESS,
  ) {
    this.analytics = new NeuroFusionAnalytics(deps.analyticsService);
    this.now = deps.now ?? (() => Date.now());

    this.state = {
      phase: 'idle',
      runState: null,
      summary: null,
      answerInput: '',
      lastAnswerCorrect: null,
      calibration: {
        taps: [],
        targetTaps: 10,
        result: initialProgress.calibration,
      },
      progress: initialProgress,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): NeuroFusionStoreState {
    return this.state;
  }

  async hydrateProgress(): Promise<void> {
    const progress = await this.deps.progressStore.load();
    this.state = {
      ...this.state,
      progress,
      calibration: {
        ...this.state.calibration,
        result: progress.calibration,
      },
    };
    this.emit();
  }

  resolveDailySeed(dateKey: string): number {
    const resolved = this.deps.progressStore.resolveDailySeed(this.state.progress, dateKey);
    this.state = {
      ...this.state,
      progress: resolved.progress,
    };

    void this.deps.progressStore.save(resolved.progress);

    return resolved.seed;
  }

  startCalibration(): void {
    this.analytics.trackScreenView('neurofusion_calibration');
    this.state = {
      ...this.state,
      phase: 'calibrating',
      calibration: {
        ...this.state.calibration,
        taps: [],
        result: null,
      },
    };
    this.emit();
  }

  registerCalibrationTap(timestampMs = this.now()): void {
    if (this.state.phase !== 'calibrating') {
      return;
    }

    const taps = [...this.state.calibration.taps, timestampMs];

    this.state = {
      ...this.state,
      calibration: {
        ...this.state.calibration,
        taps,
      },
    };

    if (taps.length >= this.state.calibration.targetTaps) {
      this.completeCalibration();
      return;
    }

    this.emit();
  }

  cancelCalibration(): void {
    if (this.state.phase !== 'calibrating') {
      return;
    }

    this.state = {
      ...this.state,
      phase: 'idle',
    };
    this.emit();
  }

  startRun(seed = this.now()): void {
    const presetConfig = createNeuroFusionConfig(this.sessionConfig.preset, this.sessionConfig.configOverrides);
    const bpm = this.sessionConfig.bpm
      ? clamp(this.sessionConfig.bpm, presetConfig.minBpm, presetConfig.maxBpm)
      : presetConfig.bpm;

    const runState = this.startUseCase.execute({
      seed: this.sessionConfig.seedOverride ?? seed,
      startedAtMs: this.now(),
      modeVariant: this.sessionConfig.modeVariant,
      preset: this.sessionConfig.preset,
      trackId: this.sessionConfig.trackId,
      configOverrides: {
        ...this.sessionConfig.configOverrides,
        bpm,
      },
      calibrationOffsetMs: this.state.calibration.result?.offsetMs,
      calibrationStdDevMs: this.state.calibration.result?.stdDevMs,
    });

    this.lastTrackedPhaseIndex = -1;

    this.analytics.trackScreenView('neurofusion_run');
    this.analytics.trackRunStart({
      bpm: runState.beatDurationMs > 0 ? Math.round(60_000 / runState.beatDurationMs) : bpm,
      preset: runState.preset,
      seed: runState.seed,
      trackId: runState.trackId,
      modeVariant: runState.modeVariant,
    });

    this.state = {
      ...this.state,
      phase: 'running',
      runState,
      summary: null,
      answerInput: '',
      lastAnswerCorrect: null,
    };

    this.trackPhaseTransition(runState);
    this.emit();
  }

  tick(timestampMs = this.now()): void {
    if (this.state.phase !== 'running') {
      return;
    }

    const runState = this.tickUseCase.execute(timestampMs);
    this.trackPhaseTransition(runState);

    if (runState.status === 'finished') {
      this.finalizeRun(runState);
      return;
    }

    this.state = {
      ...this.state,
      runState,
    };

    this.emit();
  }

  appendDigit(digit: string): void {
    if (this.state.phase !== 'running' || !/^[0-9]$/.test(digit)) {
      return;
    }

    this.state = {
      ...this.state,
      answerInput: `${this.state.answerInput}${digit}`.slice(0, 6),
    };

    this.emit();
  }

  backspace(): void {
    if (this.state.phase !== 'running' || this.state.answerInput.length === 0) {
      return;
    }

    this.state = {
      ...this.state,
      answerInput: this.state.answerInput.slice(0, -1),
    };
    this.emit();
  }

  clearInput(): void {
    if (this.state.phase !== 'running') {
      return;
    }

    this.state = {
      ...this.state,
      answerInput: '',
    };
    this.emit();
  }

  submitNumericInput(timestampMs = this.now()): void {
    if (this.state.phase !== 'running') {
      return;
    }

    if (this.state.answerInput.trim().length === 0) {
      return;
    }

    const numericAnswer = Number(this.state.answerInput);
    if (!Number.isFinite(numericAnswer)) {
      return;
    }

    const evaluation = this.submitUseCase.execute({
      submittedAtMs: timestampMs,
      numericAnswer,
    });

    if (!evaluation) {
      return;
    }

    this.applySubmissionFeedback(evaluation.isCorrect);
    this.state = {
      ...this.state,
      answerInput: '',
    };

    this.analytics.trackQuestionAnswered({
      phaseType: evaluation.item.phaseType,
      item: evaluation.item,
      difficultyTier: this.state.runState?.dynamic.difficultyTier ?? 1,
      isCorrect: evaluation.isCorrect,
      responseTimeMs: evaluation.responseTimeMs,
      beatAccuracy: evaluation.beatAccuracy,
      combo: evaluation.comboAfter,
      flow: evaluation.flowAfter,
    });

    this.syncAfterSubmission();
  }

  submitPuzzleOption(optionIndex: number, timestampMs = this.now()): void {
    if (this.state.phase !== 'running') {
      return;
    }

    const evaluation = this.submitUseCase.execute({
      submittedAtMs: timestampMs,
      optionIndex,
    });

    if (!evaluation) {
      return;
    }

    this.applySubmissionFeedback(evaluation.isCorrect);
    this.analytics.trackQuestionAnswered({
      phaseType: evaluation.item.phaseType,
      item: evaluation.item,
      difficultyTier: this.state.runState?.dynamic.difficultyTier ?? 1,
      isCorrect: evaluation.isCorrect,
      responseTimeMs: evaluation.responseTimeMs,
      beatAccuracy: evaluation.beatAccuracy,
      combo: evaluation.comboAfter,
      flow: evaluation.flowAfter,
    });

    this.syncAfterSubmission();
  }

  submitReaction(answer: boolean, timestampMs = this.now()): void {
    if (this.state.phase !== 'running') {
      return;
    }

    const evaluation = this.submitUseCase.execute({
      submittedAtMs: timestampMs,
      booleanAnswer: answer,
    });

    if (!evaluation) {
      return;
    }

    this.applySubmissionFeedback(evaluation.isCorrect);
    this.analytics.trackQuestionAnswered({
      phaseType: evaluation.item.phaseType,
      item: evaluation.item,
      difficultyTier: this.state.runState?.dynamic.difficultyTier ?? 1,
      isCorrect: evaluation.isCorrect,
      responseTimeMs: evaluation.responseTimeMs,
      beatAccuracy: evaluation.beatAccuracy,
      combo: evaluation.comboAfter,
      flow: evaluation.flowAfter,
    });

    this.syncAfterSubmission();
  }

  forceNextItem(): void {
    if (this.state.phase !== 'running') {
      return;
    }

    this.generateUseCase.execute(this.now());
    this.state = {
      ...this.state,
      runState: this.engine.getState(),
      answerInput: '',
    };
    this.emit();
  }

  finishRun(): void {
    if (this.state.phase !== 'running') {
      return;
    }

    const runState = this.endUseCase.execute(this.now());
    this.finalizeRun(runState);
  }

  private syncAfterSubmission(): void {
    const runState = this.engine.getState();

    if (runState.status === 'finished') {
      this.finalizeRun(runState);
      return;
    }

    this.trackPhaseTransition(runState);

    this.state = {
      ...this.state,
      runState,
    };

    this.emit();
  }

  private applySubmissionFeedback(isCorrect: boolean): void {
    this.state = {
      ...this.state,
      lastAnswerCorrect: isCorrect,
    };
  }

  private trackPhaseTransition(runState: NeuroFusionRunState): void {
    if (runState.phaseIndex === this.lastTrackedPhaseIndex) {
      return;
    }

    this.lastTrackedPhaseIndex = runState.phaseIndex;

    this.analytics.trackPhaseStart(runState.currentPhase, runState.phaseIndex);
  }

  private async completeCalibration(): Promise<void> {
    const taps = this.state.calibration.taps;
    const presetConfig = createNeuroFusionConfig(this.sessionConfig.preset, this.sessionConfig.configOverrides);
    const result = this.calibrateUseCase.execute({
      tapTimestampsMs: taps,
      bpm: this.sessionConfig.bpm ?? presetConfig.bpm,
      referenceStartMs: taps[0],
    });

    this.analytics.trackCalibrationCompleted(result.offsetMs, result.stdDevMs);

    const updatedProgress = this.deps.progressStore.upsertCalibration(this.state.progress, result);
    await this.deps.progressStore.save(updatedProgress);

    this.state = {
      ...this.state,
      phase: 'idle',
      progress: updatedProgress,
      calibration: {
        ...this.state.calibration,
        taps: [],
        result,
      },
    };

    this.emit();
  }

  private finalizeRun(runState: NeuroFusionRunState): void {
    const summary = runState.summary;
    if (!summary) {
      return;
    }

    const updatedProgress = this.deps.progressStore.applyRunSummary(this.state.progress, summary);
    void this.deps.progressStore.save(updatedProgress);

    this.analytics.trackRunEnd(runState);
    this.analytics.trackRewardClaimed(summary.grade, 'bundle');

    this.state = {
      ...this.state,
      phase: 'finished',
      runState,
      summary,
      progress: updatedProgress,
      answerInput: '',
    };

    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}
