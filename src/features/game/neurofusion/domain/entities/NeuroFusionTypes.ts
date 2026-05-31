import type { QuestionType } from '@features/game/domain/entities/Question';

export type NeuroFusionPreset = 'beginner' | 'standard' | 'hardcore';

export type NeuroFusionModeVariant = 'standard' | 'daily_challenge' | 'practice';

export type NeuroFusionPhaseType = 'rhythm_math' | 'puzzle' | 'cognitive_blend' | 'boss';

export type NeuroFusionChallengeKind =
  | 'rhythm_question'
  | 'puzzle'
  | 'memory_stack'
  | 'reaction_gate';

export type NeuroFusionBeatAccuracy = 'perfect' | 'great' | 'good' | 'offbeat';

export type NeuroFusionPuzzleType =
  | 'missing_sequence'
  | 'mixed_operation_pattern'
  | 'grid_mini'
  | 'odd_one_out'
  | 'equation_balance'
  | 'quick_estimate';

export type NeuroFusionCognitiveSubtype = 'echo_stack' | 'reflex_gate';

export type NeuroFusionGrade = 'S' | 'A' | 'B' | 'C';

export type NeuroFusionRewardType = 'xp' | 'coins' | 'track_fragment' | 'badge';

export interface NeuroFusionBeatWindowMs {
  perfect: number;
  great: number;
  good: number;
}

export interface NeuroFusionPhaseLengths {
  rhythmMath: number;
  puzzle: number;
  cognitiveBlend: number;
  boss: number;
}

export interface NeuroFusionScoringWeights {
  rhythmBase: number;
  puzzleBase: number;
  memoryBase: number;
  reactionBase: number;
  speedBonusMax: number;
  comboStep: number;
  comboCap: number;
  insightStep: number;
  bossMultiplier: number;
  perfectBonus: number;
  greatBonus: number;
  goodBonus: number;
  offbeatBonus: number;
  wrongPenalty: number;
  offbeatPenalty: number;
  spamPenalty: number;
}

export interface NeuroFusionFlowConfig {
  maxFlow: number;
  gainPerfect: number;
  gainGreat: number;
  gainGood: number;
  gainCorrect: number;
  lossWrong: number;
  lossMiss: number;
  lossSpam: number;
}

export interface NeuroFusionAdaptiveConfig {
  lowAccuracyThreshold: number;
  highAccuracyThreshold: number;
  lowBeatRateThreshold: number;
  highBeatRateThreshold: number;
  widenWindowFactor: number;
  tightenWindowFactor: number;
  minWindowScale: number;
  maxWindowScale: number;
  beatsPerQuestionRecoveryStep: number;
  beatsPerQuestionPressureStep: number;
  minBeatsPerQuestion: number;
  maxBeatsPerQuestion: number;
  reactionWindowRecoveryMs: number;
  reactionWindowPressureMs: number;
  minReactionWindowMs: number;
  maxReactionWindowMs: number;
  minMemorySteps: number;
  maxMemorySteps: number;
}

export interface NeuroFusionAntiSpamConfig {
  windowMs: number;
  maxInputsInWindow: number;
  penaltyCooldownMs: number;
}

export interface NeuroFusionBossComposition {
  rhythmQuestions: number;
  puzzles: number;
  reactionGates: number;
  memoryStacks: number;
}

export interface NeuroFusionGradeThreshold {
  grade: NeuroFusionGrade;
  minScore: number;
  minAccuracy: number;
  maxAverageBeatOffsetMs: number;
}

export interface NeuroFusionConfig {
  preset: NeuroFusionPreset;
  bpm: number;
  minBpm: number;
  maxBpm: number;
  runDurationSeconds: number;
  calibrationEnabled: boolean;
  beatWindowsByTier: Record<number, NeuroFusionBeatWindowMs>;
  beatsPerQuestionByTier: Record<number, number>;
  puzzleTimeBeatsByTier: Record<number, number>;
  hintEnabled: boolean;
  phaseLengths: NeuroFusionPhaseLengths;
  scoring: NeuroFusionScoringWeights;
  flow: NeuroFusionFlowConfig;
  adaptive: NeuroFusionAdaptiveConfig;
  antiSpam: NeuroFusionAntiSpamConfig;
  puzzleMix: Record<NeuroFusionPuzzleType, number>;
  memoryStepsByTier: Record<number, number>;
  reactionWindowMsByTier: Record<number, number>;
  bossComposition: NeuroFusionBossComposition;
  gradeThresholds: NeuroFusionGradeThreshold[];
  maxDifficultyTier: number;
  minDifficultyTier: number;
}

export interface NeuroFusionPhase {
  index: number;
  type: NeuroFusionPhaseType;
  startBeat: number;
  endBeatExclusive: number;
  durationBeats: number;
}

export interface NeuroFusionChallengeBase {
  id: string;
  kind: NeuroFusionChallengeKind;
  phaseType: NeuroFusionPhaseType;
  phaseIndex: number;
  difficultyTier: number;
  startsAtBeat: number;
  targetBeat: number;
  expiresAtBeat: number;
  createdAtMs: number;
}

export interface NeuroFusionRhythmQuestion extends NeuroFusionChallengeBase {
  kind: 'rhythm_question';
  operationType: QuestionType;
  prompt: string;
  answer: number;
  beatsPerQuestion: number;
}

export interface NeuroFusionPuzzle extends NeuroFusionChallengeBase {
  kind: 'puzzle';
  puzzleType: NeuroFusionPuzzleType;
  prompt: string;
  hint?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface NeuroFusionMemoryStep {
  operator: '+' | '-' | 'x';
  value: number;
}

export interface NeuroFusionMemoryStack extends NeuroFusionChallengeBase {
  kind: 'memory_stack';
  cognitiveSubtype: 'echo_stack';
  baseNumber: number;
  revealMode: 'base_first' | 'base_last';
  steps: NeuroFusionMemoryStep[];
  prompt: string;
  answer: number;
}

export interface NeuroFusionReactionGate extends NeuroFusionChallengeBase {
  kind: 'reaction_gate';
  cognitiveSubtype: 'reflex_gate';
  gateType: 'true_false' | 'greater_than';
  prompt: string;
  expected: boolean;
  reactionWindowMs: number;
}

export type NeuroFusionChallengeItem =
  | NeuroFusionRhythmQuestion
  | NeuroFusionPuzzle
  | NeuroFusionMemoryStack
  | NeuroFusionReactionGate;

export interface NeuroFusionDynamicState {
  windowScale: number;
  beatsPerQuestion: number;
  reactionWindowMs: number;
  memorySteps: number;
  difficultyTier: number;
}

export interface NeuroFusionPhaseScoreBreakdown {
  score: number;
  correct: number;
  total: number;
  perfect: number;
  great: number;
  good: number;
  offbeat: number;
}

export interface NeuroFusionRunProgress {
  score: number;
  combo: number;
  bestCombo: number;
  flow: number;
  insightMultiplier: number;
  totalAnswers: number;
  correctAnswers: number;
  averageBeatOffsetMs: number;
  beatOffsetSamples: number;
}

export interface NeuroFusionRewardBundle {
  tier: NeuroFusionGrade;
  xp: number;
  coins: number;
  trackFragments: number;
  weeklyLeaguePoints: number;
  badges: string[];
}

export interface NeuroFusionRunSummary {
  runId: string;
  seed: number;
  modeVariant: NeuroFusionModeVariant;
  preset: NeuroFusionPreset;
  bpm: number;
  score: number;
  accuracy: number;
  avgBeatOffsetMs: number;
  bestCombo: number;
  flowPeak: number;
  phaseBreakdown: Record<NeuroFusionPhaseType, NeuroFusionPhaseScoreBreakdown>;
  grade: NeuroFusionGrade;
  rewards: NeuroFusionRewardBundle;
  startedAtMs: number;
  endedAtMs: number;
  durationSeconds: number;
}

export interface NeuroFusionRunState {
  runId: string;
  seed: number;
  modeVariant: NeuroFusionModeVariant;
  preset: NeuroFusionPreset;
  status: 'idle' | 'running' | 'finished';
  startedAtMs: number;
  endedAtMs: number | null;
  beatDurationMs: number;
  totalBeats: number;
  beatIndex: number;
  phaseIndex: number;
  phases: NeuroFusionPhase[];
  currentPhase: NeuroFusionPhaseType;
  currentItem: NeuroFusionChallengeItem | null;
  nextItemSequence: number;
  progress: NeuroFusionRunProgress;
  flowPeak: number;
  phaseBreakdown: Record<NeuroFusionPhaseType, NeuroFusionPhaseScoreBreakdown>;
  puzzleStats: Record<NeuroFusionPuzzleType, { correct: number; total: number }>;
  beatStats: Record<NeuroFusionBeatAccuracy, number>;
  dynamic: NeuroFusionDynamicState;
  spamFlags: number;
  calibrationOffsetMs: number;
  calibrationStdDevMs: number;
  trackId: string;
  summary: NeuroFusionRunSummary | null;
  bossQueue: NeuroFusionChallengeKind[];
  lastPuzzleTypes: NeuroFusionPuzzleType[];
  cognitiveToggle: NeuroFusionCognitiveSubtype;
  timingAdjustedAtBeat: number;
}

export interface NeuroFusionSubmissionInput {
  submittedAtMs: number;
  numericAnswer?: number;
  optionIndex?: number;
  booleanAnswer?: boolean;
}

export interface NeuroFusionAnswerEvaluation {
  item: NeuroFusionChallengeItem;
  isCorrect: boolean;
  beatAccuracy: NeuroFusionBeatAccuracy;
  beatOffsetMs: number;
  responseTimeMs: number;
  spamDetected: boolean;
  scoreDelta: number;
  flowDelta: number;
  comboAfter: number;
  flowAfter: number;
}

export interface NeuroFusionBeatClassification {
  beatAccuracy: NeuroFusionBeatAccuracy;
  beatOffsetMs: number;
}

export interface NeuroFusionDifficultyMetrics {
  rollingAccuracy: number;
  rollingBeatRate: number;
  recentWrongStreak: number;
}

export interface NeuroFusionCalibrationResult {
  offsetMs: number;
  stdDevMs: number;
}

export interface NeuroFusionProgressData {
  bestScore: number;
  bestGrade: NeuroFusionGrade | null;
  runHistory: NeuroFusionRunSummary[];
  dailySeedByDate: Record<string, number>;
  calibration: NeuroFusionCalibrationResult | null;
  totalTrackFragments: number;
  totalCoins: number;
}
