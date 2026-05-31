import { SeededRandom } from '@core/utils/random';
import {
  createNeuroFusionConfig,
  getDefaultNeuroFusionConfig,
} from '@features/game/neurofusion/domain/entities/NeuroFusionConfig';
import type {
  NeuroFusionAnswerEvaluation,
  NeuroFusionBeatAccuracy,
  NeuroFusionChallengeItem,
  NeuroFusionChallengeKind,
  NeuroFusionConfig,
  NeuroFusionDifficultyMetrics,
  NeuroFusionModeVariant,
  NeuroFusionPhase,
  NeuroFusionPhaseType,
  NeuroFusionPreset,
  NeuroFusionPuzzleType,
  NeuroFusionRunState,
  NeuroFusionSubmissionInput,
} from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';

import { BeatClock } from './BeatClock';
import { NeuroFusionAdaptiveController } from './NeuroFusionAdaptiveController';
import { NeuroFusionAntiSpamDetector } from './NeuroFusionAntiSpamDetector';
import { NeuroFusionChallengeFactory } from './NeuroFusionChallengeFactory';
import { NeuroFusionPhaseScheduler } from './NeuroFusionPhaseScheduler';
import { buildRewardBundle, gradeRun } from './NeuroFusionRewards';
import { NeuroFusionScoringService } from './NeuroFusionScoringService';

interface StartRunInput {
  seed: number;
  startedAtMs: number;
  modeVariant?: NeuroFusionModeVariant;
  preset?: NeuroFusionPreset;
  configOverrides?: Partial<NeuroFusionConfig>;
  calibrationOffsetMs?: number;
  calibrationStdDevMs?: number;
  trackId?: string;
}

interface EndRunInput {
  endedAtMs: number;
}

export class NeuroFusionRunEngine {
  private state: NeuroFusionRunState | null = null;

  private config: NeuroFusionConfig = getDefaultNeuroFusionConfig();
  private beatClock: BeatClock | null = null;
  private factory: NeuroFusionChallengeFactory | null = null;
  private phaseScheduler: NeuroFusionPhaseScheduler | null = null;
  private scoringService: NeuroFusionScoringService | null = null;
  private adaptiveController: NeuroFusionAdaptiveController | null = null;
  private antiSpam: NeuroFusionAntiSpamDetector | null = null;

  private queueRandom: SeededRandom | null = null;

  private readonly recentAccuracy: Array<{ correct: boolean; onBeat: boolean }> = [];
  private recentWrongStreak = 0;

  startRun(input: StartRunInput): NeuroFusionRunState {
    const preset = input.preset ?? 'standard';
    this.config = createNeuroFusionConfig(preset, input.configOverrides ?? {});

    this.beatClock = new BeatClock({
      bpm: this.config.bpm,
      startedAtMs: input.startedAtMs,
      calibrationOffsetMs: input.calibrationOffsetMs,
    });

    this.factory = new NeuroFusionChallengeFactory(input.seed, this.config);
    this.phaseScheduler = new NeuroFusionPhaseScheduler();
    this.scoringService = new NeuroFusionScoringService(this.config);
    this.adaptiveController = new NeuroFusionAdaptiveController(this.config.adaptive);
    this.antiSpam = new NeuroFusionAntiSpamDetector(this.config.antiSpam);
    this.queueRandom = new SeededRandom(input.seed ^ 0x9e3779b9);

    this.recentAccuracy.length = 0;
    this.recentWrongStreak = 0;

    const totalBeats = Math.max(
      1,
      Math.floor((this.config.runDurationSeconds * 1000) / this.beatClock.beatDurationMs),
    );

    const phases = this.phaseScheduler.build(totalBeats, this.config);

    const startTier = clamp(
      preset === 'hardcore' ? 3 : preset === 'beginner' ? 1 : 2,
      this.config.minDifficultyTier,
      this.config.maxDifficultyTier,
    );

    this.state = {
      runId: `neurofusion-${input.seed}`,
      seed: input.seed,
      modeVariant: input.modeVariant ?? 'standard',
      preset,
      status: 'running',
      startedAtMs: input.startedAtMs,
      endedAtMs: null,
      beatDurationMs: this.beatClock.beatDurationMs,
      totalBeats,
      beatIndex: 0,
      phaseIndex: 0,
      phases,
      currentPhase: phases[0]?.type ?? 'boss',
      currentItem: null,
      nextItemSequence: 1,
      progress: {
        score: 0,
        combo: 0,
        bestCombo: 0,
        flow: 0,
        insightMultiplier: 1,
        totalAnswers: 0,
        correctAnswers: 0,
        averageBeatOffsetMs: 0,
        beatOffsetSamples: 0,
      },
      flowPeak: 0,
      phaseBreakdown: {
        rhythm_math: emptyPhaseBreakdown(),
        puzzle: emptyPhaseBreakdown(),
        cognitive_blend: emptyPhaseBreakdown(),
        boss: emptyPhaseBreakdown(),
      },
      puzzleStats: {
        missing_sequence: { correct: 0, total: 0 },
        mixed_operation_pattern: { correct: 0, total: 0 },
        grid_mini: { correct: 0, total: 0 },
        odd_one_out: { correct: 0, total: 0 },
        equation_balance: { correct: 0, total: 0 },
        quick_estimate: { correct: 0, total: 0 },
      },
      beatStats: {
        perfect: 0,
        great: 0,
        good: 0,
        offbeat: 0,
      },
      dynamic: {
        windowScale: 1,
        beatsPerQuestion: this.config.beatsPerQuestionByTier[startTier],
        reactionWindowMs: this.config.reactionWindowMsByTier[startTier],
        memorySteps: this.config.memoryStepsByTier[startTier],
        difficultyTier: startTier,
      },
      spamFlags: 0,
      calibrationOffsetMs: input.calibrationOffsetMs ?? 0,
      calibrationStdDevMs: input.calibrationStdDevMs ?? 0,
      trackId: input.trackId ?? metronomeTrackId(this.config.bpm),
      summary: null,
      bossQueue: [],
      lastPuzzleTypes: [],
      cognitiveToggle: 'echo_stack',
      timingAdjustedAtBeat: 0,
    };

    this.ensureCurrentItem(input.startedAtMs);

    return this.cloneState();
  }

  getState(): NeuroFusionRunState {
    if (!this.state) {
      throw new Error('Neuro Fusion run not started');
    }

    return this.cloneState();
  }

  nextBeatTick(timestampMs: number): NeuroFusionRunState {
    this.assertReady();
    const state = this.state as NeuroFusionRunState;

    if (state.status !== 'running') {
      return this.cloneState();
    }

    const clock = this.beatClock as BeatClock;
    const nextBeatIndex = clock.getBeatIndex(timestampMs);

    if (nextBeatIndex <= state.beatIndex) {
      this.ensureCurrentItem(timestampMs);
      return this.cloneState();
    }

    for (let beat = state.beatIndex + 1; beat <= nextBeatIndex; beat += 1) {
      state.beatIndex = beat;

      if (beat >= state.totalBeats) {
        this.endRun({ endedAtMs: timestampMs });
        break;
      }

      this.advancePhaseIfNeeded();

      if (state.currentItem && beat >= state.currentItem.expiresAtBeat) {
        this.applyTimeoutPenalty(state.currentItem);
        state.currentItem = null;
      }

      this.ensureCurrentItem(timestampMs);
    }

    return this.cloneState();
  }

  generateNextItem(timestampMs: number): NeuroFusionChallengeItem | null {
    this.assertReady();
    const state = this.state as NeuroFusionRunState;

    if (state.status !== 'running') {
      return state.currentItem;
    }

    state.currentItem = null;
    this.ensureCurrentItem(timestampMs);
    return state.currentItem;
  }

  submitAnswer(input: NeuroFusionSubmissionInput): NeuroFusionAnswerEvaluation | null {
    this.assertReady();

    const state = this.state as NeuroFusionRunState;
    if (state.status !== 'running' || !state.currentItem) {
      return null;
    }

    const item = state.currentItem;
    const clock = this.beatClock as BeatClock;
    const spamResult = (this.antiSpam as NeuroFusionAntiSpamDetector).registerInput(input.submittedAtMs);

    const submitBeat = clock.getBeatIndex(input.submittedAtMs);
    const expired = submitBeat >= item.expiresAtBeat;
    const responseTimeMs = Math.max(0, input.submittedAtMs - item.createdAtMs);

    const isCorrect = !expired && this.evaluateCorrectness(item, input, responseTimeMs);

    const windows = this.config.beatWindowsByTier[state.dynamic.difficultyTier];
    const beatClassification = clock.classifyAgainstBeat(
      input.submittedAtMs,
      item.targetBeat,
      windows,
      state.dynamic.windowScale,
    );

    const scoring = (this.scoringService as NeuroFusionScoringService).score({
      kind: item.kind,
      isCorrect,
      beatAccuracy: beatClassification.beatAccuracy,
      responseTimeMs,
      combo: state.progress.combo,
      insightMultiplier: state.progress.insightMultiplier,
      difficultyTier: state.dynamic.difficultyTier,
      isBoss: item.phaseType === 'boss',
      spamDetected: spamResult.isSpam,
      currentFlow: state.progress.flow,
    });

    this.applyEvaluationSideEffects({
      item,
      isCorrect,
      beatAccuracy: beatClassification.beatAccuracy,
      beatOffsetMs: beatClassification.beatOffsetMs,
      responseTimeMs,
      spamDetected: spamResult.isSpam,
      scoreDelta: scoring.scoreDelta,
      flowDelta: scoring.flowDelta,
      comboAfter: scoring.comboAfter,
      flowAfter: 0,
    });

    const flowAfter = state.progress.flow;

    const evaluation: NeuroFusionAnswerEvaluation = {
      item,
      isCorrect,
      beatAccuracy: beatClassification.beatAccuracy,
      beatOffsetMs: beatClassification.beatOffsetMs,
      responseTimeMs,
      spamDetected: spamResult.isSpam,
      scoreDelta: scoring.scoreDelta,
      flowDelta: scoring.flowDelta,
      comboAfter: scoring.comboAfter,
      flowAfter,
    };

    state.currentItem = null;
    this.ensureCurrentItem(input.submittedAtMs);

    if (state.beatIndex >= state.totalBeats - 1) {
      this.endRun({ endedAtMs: input.submittedAtMs });
    }

    return evaluation;
  }

  endRun(input: EndRunInput): NeuroFusionRunState {
    this.assertReady();

    const state = this.state as NeuroFusionRunState;
    if (state.status === 'finished') {
      return this.cloneState();
    }

    state.status = 'finished';
    state.endedAtMs = input.endedAtMs;

    const grade = gradeRun(state, this.config);
    const rewards = buildRewardBundle(state, grade);

    const accuracy =
      state.progress.totalAnswers === 0
        ? 0
        : state.progress.correctAnswers / state.progress.totalAnswers;

    state.summary = {
      runId: state.runId,
      seed: state.seed,
      modeVariant: state.modeVariant,
      preset: state.preset,
      bpm: this.config.bpm,
      score: state.progress.score,
      accuracy,
      avgBeatOffsetMs: Math.round(state.progress.averageBeatOffsetMs),
      bestCombo: state.progress.bestCombo,
      flowPeak: state.flowPeak,
      phaseBreakdown: {
        rhythm_math: state.phaseBreakdown.rhythm_math,
        puzzle: state.phaseBreakdown.puzzle,
        cognitive_blend: state.phaseBreakdown.cognitive_blend,
        boss: state.phaseBreakdown.boss,
      },
      grade,
      rewards,
      startedAtMs: state.startedAtMs,
      endedAtMs: state.endedAtMs,
      durationSeconds: Math.max(1, Math.round((state.endedAtMs - state.startedAtMs) / 1000)),
    };

    return this.cloneState();
  }

  getConfig(): NeuroFusionConfig {
    return this.config;
  }

  private applyEvaluationSideEffects(evaluation: NeuroFusionAnswerEvaluation): void {
    const state = this.state as NeuroFusionRunState;

    state.progress.totalAnswers += 1;
    state.progress.correctAnswers += evaluation.isCorrect ? 1 : 0;
    state.progress.score = Math.max(0, state.progress.score + evaluation.scoreDelta);
    state.progress.combo = evaluation.comboAfter;
    state.progress.bestCombo = Math.max(state.progress.bestCombo, state.progress.combo);

    state.progress.flow = clamp(
      state.progress.flow + evaluation.flowDelta,
      0,
      this.config.flow.maxFlow,
    );
    state.flowPeak = Math.max(state.flowPeak, state.progress.flow);

    state.progress.beatOffsetSamples += 1;
    state.progress.averageBeatOffsetMs = runningAverage(
      state.progress.averageBeatOffsetMs,
      state.progress.beatOffsetSamples,
      evaluation.beatOffsetMs,
    );

    state.beatStats[evaluation.beatAccuracy] += 1;

    const phaseStats = state.phaseBreakdown[evaluation.item.phaseType];
    phaseStats.total += 1;
    phaseStats.correct += evaluation.isCorrect ? 1 : 0;
    phaseStats.score = Math.max(0, phaseStats.score + evaluation.scoreDelta);
    phaseStats[evaluation.beatAccuracy] += 1;

    if (evaluation.item.kind === 'puzzle') {
      const puzzleType = evaluation.item.puzzleType;
      state.puzzleStats[puzzleType].total += 1;
      state.puzzleStats[puzzleType].correct += evaluation.isCorrect ? 1 : 0;

      if (evaluation.isCorrect) {
        state.progress.insightMultiplier = clamp(
          state.progress.insightMultiplier + 0.08,
          1,
          2.5,
        );
      } else {
        state.progress.insightMultiplier = clamp(
          state.progress.insightMultiplier - 0.16,
          1,
          2.5,
        );
      }
    } else {
      state.progress.insightMultiplier = clamp(state.progress.insightMultiplier - 0.03, 1, 2.5);
    }

    if (evaluation.spamDetected) {
      state.spamFlags += 1;
    }

    this.recordDifficultySignal(evaluation);
  }

  private recordDifficultySignal(evaluation: NeuroFusionAnswerEvaluation): void {
    const onBeat = evaluation.beatAccuracy !== 'offbeat';
    this.recentAccuracy.push({ correct: evaluation.isCorrect, onBeat });
    while (this.recentAccuracy.length > 10) {
      this.recentAccuracy.shift();
    }

    if (evaluation.isCorrect) {
      this.recentWrongStreak = 0;
    } else {
      this.recentWrongStreak += 1;
    }

    const state = this.state as NeuroFusionRunState;
    if (state.progress.totalAnswers < 3 || state.progress.totalAnswers % 4 !== 0) {
      return;
    }

    const metrics: NeuroFusionDifficultyMetrics = {
      rollingAccuracy: this.recentAccuracy.length === 0
        ? 0
        : this.recentAccuracy.filter((item) => item.correct).length / this.recentAccuracy.length,
      rollingBeatRate: this.recentAccuracy.length === 0
        ? 0
        : this.recentAccuracy.filter((item) => item.onBeat).length / this.recentAccuracy.length,
      recentWrongStreak: this.recentWrongStreak,
    };

    const adjusted = (this.adaptiveController as NeuroFusionAdaptiveController).adjust(state.dynamic, metrics);
    const tier = clamp(Math.round(adjusted.difficultyTier), this.config.minDifficultyTier, this.config.maxDifficultyTier);

    state.dynamic = {
      ...adjusted,
      difficultyTier: tier,
      beatsPerQuestion: Math.round(
        clamp(
          Math.round((adjusted.beatsPerQuestion + this.config.beatsPerQuestionByTier[tier]) / 2),
          this.config.adaptive.minBeatsPerQuestion,
          this.config.adaptive.maxBeatsPerQuestion,
        ),
      ),
      reactionWindowMs: Math.round(
        clamp(
          Math.round((adjusted.reactionWindowMs + this.config.reactionWindowMsByTier[tier]) / 2),
          this.config.adaptive.minReactionWindowMs,
          this.config.adaptive.maxReactionWindowMs,
        ),
      ),
      memorySteps: Math.round(
        clamp(
          Math.round((adjusted.memorySteps + this.config.memoryStepsByTier[tier]) / 2),
          this.config.adaptive.minMemorySteps,
          this.config.adaptive.maxMemorySteps,
        ),
      ),
    };

    state.timingAdjustedAtBeat = state.beatIndex;
  }

  private evaluateCorrectness(
    item: NeuroFusionChallengeItem,
    input: NeuroFusionSubmissionInput,
    responseTimeMs: number,
  ): boolean {
    if (item.kind === 'rhythm_question') {
      return typeof input.numericAnswer === 'number' && input.numericAnswer === item.answer;
    }

    if (item.kind === 'puzzle') {
      if (typeof input.optionIndex === 'number') {
        return input.optionIndex === item.correctOptionIndex;
      }

      if (typeof input.numericAnswer === 'number') {
        return String(input.numericAnswer) === item.options[item.correctOptionIndex];
      }

      return false;
    }

    if (item.kind === 'memory_stack') {
      return typeof input.numericAnswer === 'number' && input.numericAnswer === item.answer;
    }

    const gateCorrect = typeof input.booleanAnswer === 'boolean' && input.booleanAnswer === item.expected;
    const withinWindow = responseTimeMs <= item.reactionWindowMs;
    return gateCorrect && withinWindow;
  }

  private ensureCurrentItem(nowMs: number): void {
    const state = this.state as NeuroFusionRunState;

    if (state.status !== 'running' || state.currentItem) {
      return;
    }

    const phase = this.currentPhase();
    if (!phase) {
      return;
    }

    if (phase.type === 'boss' && state.bossQueue.length === 0) {
      state.bossQueue = this.createBossQueue();
    }

    let bossForcedKind: NeuroFusionChallengeKind | undefined;
    if (phase.type === 'boss' && state.bossQueue.length > 0) {
      bossForcedKind = state.bossQueue.shift();
    }

    const item = (this.factory as NeuroFusionChallengeFactory).build({
      phase,
      beatIndex: state.beatIndex,
      sequence: state.nextItemSequence,
      difficultyTier: state.dynamic.difficultyTier,
      beatsPerQuestion: state.dynamic.beatsPerQuestion,
      reactionWindowMs: state.dynamic.reactionWindowMs,
      memorySteps: state.dynamic.memorySteps,
      hintEnabled: this.config.hintEnabled,
      bossForcedKind,
      puzzleStats: state.puzzleStats,
      lastPuzzleTypes: state.lastPuzzleTypes,
      cognitiveToggle: state.cognitiveToggle,
    });

    item.createdAtMs = nowMs;

    const cappedExpiry = Math.min(item.expiresAtBeat, phase.endBeatExclusive);
    item.expiresAtBeat = Math.max(item.startsAtBeat + 1, cappedExpiry);
    item.targetBeat = Math.min(item.targetBeat, item.expiresAtBeat - 1);

    state.currentItem = item;
    state.nextItemSequence += 1;

    if (item.kind === 'puzzle') {
      state.lastPuzzleTypes = [...state.lastPuzzleTypes.slice(-2), item.puzzleType];
    }

    if (phase.type === 'cognitive_blend') {
      state.cognitiveToggle =
        item.kind === 'memory_stack'
          ? 'reflex_gate'
          : item.kind === 'reaction_gate'
            ? 'echo_stack'
            : state.cognitiveToggle;
    }
  }

  private advancePhaseIfNeeded(): void {
    const state = this.state as NeuroFusionRunState;
    const phase = this.currentPhase();

    if (!phase) {
      return;
    }

    if (state.beatIndex < phase.endBeatExclusive) {
      return;
    }

    state.phaseIndex = Math.min(state.phaseIndex + 1, state.phases.length - 1);
    state.currentPhase = state.phases[state.phaseIndex].type;
    state.currentItem = null;

    if (state.currentPhase === 'boss') {
      state.bossQueue = this.createBossQueue();
    }
  }

  private applyTimeoutPenalty(item: NeuroFusionChallengeItem): void {
    const state = this.state as NeuroFusionRunState;

    const timeoutPenalty = Math.round(this.config.scoring.wrongPenalty * 0.6);
    const scoreDelta = -timeoutPenalty;
    const flowDelta = -this.config.flow.lossMiss;

    state.progress.totalAnswers += 1;
    state.progress.score = Math.max(0, state.progress.score + scoreDelta);
    state.progress.combo = 0;
    state.progress.flow = clamp(state.progress.flow + flowDelta, 0, this.config.flow.maxFlow);

    const phaseStats = state.phaseBreakdown[item.phaseType];
    phaseStats.total += 1;
    phaseStats.score = Math.max(0, phaseStats.score + scoreDelta);
    phaseStats.offbeat += 1;

    state.beatStats.offbeat += 1;

    this.recentAccuracy.push({ correct: false, onBeat: false });
    while (this.recentAccuracy.length > 10) {
      this.recentAccuracy.shift();
    }
    this.recentWrongStreak += 1;
  }

  private createBossQueue(): NeuroFusionChallengeKind[] {
    const queue: NeuroFusionChallengeKind[] = [];

    for (let index = 0; index < this.config.bossComposition.rhythmQuestions; index += 1) {
      queue.push('rhythm_question');
    }

    for (let index = 0; index < this.config.bossComposition.puzzles; index += 1) {
      queue.push('puzzle');
    }

    for (let index = 0; index < this.config.bossComposition.reactionGates; index += 1) {
      queue.push('reaction_gate');
    }

    for (let index = 0; index < this.config.bossComposition.memoryStacks; index += 1) {
      queue.push('memory_stack');
    }

    const random = this.queueRandom as SeededRandom;
    for (let index = queue.length - 1; index > 0; index -= 1) {
      const nextIndex = random.nextInt(0, index);
      [queue[index], queue[nextIndex]] = [queue[nextIndex], queue[index]];
    }

    return queue;
  }

  private currentPhase(): NeuroFusionPhase | null {
    const state = this.state as NeuroFusionRunState;
    return state.phases[state.phaseIndex] ?? null;
  }

  private cloneState(): NeuroFusionRunState {
    return JSON.parse(JSON.stringify(this.state)) as NeuroFusionRunState;
  }

  private assertReady(): void {
    if (!this.state || !this.beatClock || !this.factory || !this.scoringService || !this.phaseScheduler || !this.adaptiveController || !this.antiSpam) {
      throw new Error('Neuro Fusion engine is not initialized. Call startRun first.');
    }
  }
}

function emptyPhaseBreakdown() {
  return {
    score: 0,
    correct: 0,
    total: 0,
    perfect: 0,
    great: 0,
    good: 0,
    offbeat: 0,
  };
}

function runningAverage(previousAverage: number, samples: number, nextValue: number): number {
  if (samples <= 1) {
    return nextValue;
  }

  const previousTotal = previousAverage * (samples - 1);
  return (previousTotal + nextValue) / samples;
}

function metronomeTrackId(bpm: number): string {
  if (bpm < 100) {
    return 'metro_90';
  }

  if (bpm < 120) {
    return 'metro_110';
  }

  if (bpm < 140) {
    return 'metro_130';
  }

  return 'metro_150';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
