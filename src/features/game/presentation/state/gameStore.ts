import type { EnvConfig } from '@app/config/env';
import { gameEvents } from '@core/analytics/events';
import { AnalyticsService } from '@core/analytics/AnalyticsService';
import { clamp } from '@core/utils/clamp';
import type { Answer } from '@features/game/domain/entities/Answer';
import {
  GAME_MODE_POLICIES,
  type GameMode,
} from '@features/game/domain/entities/GameMode';
import type {
  GameSessionSummary,
  PlayerProgress,
  SessionFinishReason,
} from '@features/game/domain/entities/ProgressModels';
import type { Question, QuestionType } from '@features/game/domain/entities/Question';
import type { Session } from '@features/game/domain/entities/Session';
import { EndSession } from '@features/game/domain/usecases/EndSession';
import { StartSession } from '@features/game/domain/usecases/StartSession';
import { SubmitAnswer } from '@features/game/domain/usecases/SubmitAnswer';
import { DifficultyController } from '@features/game/domain/services/difficulty/DifficultyController';
import { QuestionGenerator } from '@features/game/domain/services/generator/QuestionGenerator';
import { ScoreCalculator } from '@features/game/domain/services/scoring/ScoreCalculator';
import { TimerEngine } from '@features/game/domain/services/timer/TimerEngine';
import { AnswerValidator } from '@features/game/domain/services/validation/AnswerValidator';

const XP_PER_LEVEL = 100;
const ANSWER_INPUT_LIMIT = 4;

type Listener = () => void;

export type GamePhase = 'idle' | 'running' | 'finished';
export type { GameSessionSummary, PlayerProgress, SessionFinishReason };

export interface GameSessionConfig {
  mode: GameMode;
  allowedQuestionTypes: QuestionType[];
  durationSecondsOverride?: number;
  questionLimitOverride?: number;
  seedOverride?: number;
}

export interface GameStoreState {
  phase: GamePhase;
  session: Session | null;
  currentQuestion: Question | null;
  answerInput: string;
  remainingMs: number;
  isTimedMode: boolean;
  lastAnswerCorrect: boolean | null;
  summary: GameSessionSummary | null;
  player: PlayerProgress;
}

interface GameStoreDependencies {
  env: EnvConfig;
  analytics: AnalyticsService;
  questionGeneratorFactory: (seed: number, allowedTypes: QuestionType[]) => QuestionGenerator;
  scoreCalculator: ScoreCalculator;
  answerValidator: AnswerValidator;
  difficultyController: DifficultyController;
  now?: () => number;
}

export class GameStore {
  private state: GameStoreState;
  private readonly listeners = new Set<Listener>();
  private readonly sessionConfig: GameSessionConfig;

  private readonly startSessionUseCase = new StartSession();
  private readonly endSessionUseCase = new EndSession();
  private readonly submitAnswerUseCase: SubmitAnswer;

  private readonly now: () => number;

  private answers: Answer[] = [];
  private timerEngine: TimerEngine | null = null;
  private questionGenerator: QuestionGenerator | null = null;
  private sessionXpGain = 0;

  constructor(
    private readonly deps: GameStoreDependencies,
    player: PlayerProgress,
    sessionConfig: GameSessionConfig = {
      mode: 'sprint',
      allowedQuestionTypes: ['addition', 'subtraction'],
    },
  ) {
    this.sessionConfig = normalizeSessionConfig(sessionConfig);
    this.submitAnswerUseCase = new SubmitAnswer(deps.answerValidator, deps.scoreCalculator);
    this.now = deps.now ?? (() => Date.now());

    const modePolicy = GAME_MODE_POLICIES[this.sessionConfig.mode];
    const initialDurationSeconds = resolveSessionDurationSeconds(this.sessionConfig, deps.env);

    this.state = {
      phase: 'idle',
      session: null,
      currentQuestion: null,
      answerInput: '',
      remainingMs: modePolicy.timed ? initialDurationSeconds * 1000 : 0,
      isTimedMode: modePolicy.timed,
      lastAnswerCorrect: null,
      summary: null,
      player: normalizePlayer(player),
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): GameStoreState {
    return this.state;
  }

  startSession(seed = this.now()): void {
    const sessionSeed = this.sessionConfig.seedOverride ?? seed;
    const modePolicy = GAME_MODE_POLICIES[this.sessionConfig.mode];
    const durationSeconds = resolveSessionDurationSeconds(this.sessionConfig, this.deps.env);
    const durationMs = modePolicy.timed ? durationSeconds * 1000 : 0;
    const questionLimit = resolveQuestionLimit(this.sessionConfig);
    const level = clamp(this.state.player.level, this.deps.env.difficultyFloor, this.deps.env.difficultyCeiling);

    this.answers = [];
    this.sessionXpGain = 0;
    this.questionGenerator = this.deps.questionGeneratorFactory(sessionSeed, this.sessionConfig.allowedQuestionTypes);
    this.timerEngine = modePolicy.timed
      ? new TimerEngine({
          totalDurationMs: durationMs,
          tickIntervalMs: 100,
        })
      : null;

    const startedAt = this.now();
    const session = this.startSessionUseCase.execute({
      id: `session-${sessionSeed}`,
      mode: this.sessionConfig.mode,
      questionTypes: this.sessionConfig.allowedQuestionTypes,
      questionLimit,
      startedAt,
      durationSeconds,
      difficultyLevel: level,
    });

    const firstQuestion = this.questionGenerator.generate(session.difficultyLevel, startedAt);

    this.state = {
      ...this.state,
      phase: 'running',
      session,
      currentQuestion: firstQuestion,
      answerInput: '',
      remainingMs: durationMs,
      isTimedMode: modePolicy.timed,
      lastAnswerCorrect: null,
      summary: null,
    };

    this.deps.analytics.track(gameEvents.sessionStart, {
      session_id: session.id,
      mode: session.mode,
      duration_seconds: session.durationSeconds,
      difficulty: session.difficultyLevel,
      level: this.state.player.level,
      question_types: session.questionTypes.join(','),
      question_limit: session.questionLimit,
    });

    if (session.mode === 'daily') {
      this.deps.analytics.track(gameEvents.dailyChallengeStarted, {
        session_id: session.id,
        question_limit: session.questionLimit,
        duration_seconds: session.durationSeconds,
      });
    }

    this.emit();
  }

  tick(deltaMs = 100): void {
    if (this.state.phase !== 'running' || !this.timerEngine) {
      return;
    }

    const snapshot = this.timerEngine.tick(deltaMs);

    this.state = {
      ...this.state,
      remainingMs: snapshot.remainingMs,
    };

    if (snapshot.finished) {
      this.finishSessionInternal('timeout');
      return;
    }

    this.emit();
  }

  appendDigit(digit: string): void {
    if (this.state.phase !== 'running' || !/^[0-9]$/.test(digit)) {
      return;
    }

    if (this.state.answerInput.length >= ANSWER_INPUT_LIMIT) {
      return;
    }

    this.state = {
      ...this.state,
      answerInput: `${this.state.answerInput}${digit}`,
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
    if (this.state.phase !== 'running' || this.state.answerInput.length === 0) {
      return;
    }

    this.state = {
      ...this.state,
      answerInput: '',
    };

    this.emit();
  }

  submitAnswer(): boolean {
    if (this.state.phase !== 'running' || !this.state.session || !this.state.currentQuestion) {
      return false;
    }

    if (this.state.answerInput.trim().length === 0) {
      return false;
    }

    const parsedAnswer = Number(this.state.answerInput);
    if (!Number.isFinite(parsedAnswer)) {
      return false;
    }

    const currentQuestion = this.state.currentQuestion;

    const nowMs = this.now();
    const responseTimeMs = Math.max(0, nowMs - currentQuestion.createdAt);

    const submitResult = this.submitAnswerUseCase.execute({
      session: this.state.session,
      question: currentQuestion,
      answerValue: parsedAnswer,
      responseTimeMs,
    });

    this.answers = [...this.answers, submitResult.answer];

    const gainedXp = calculateXpForAnswer(
      submitResult.answer.isCorrect,
      submitResult.session.combo,
      submitResult.session.difficultyLevel,
      currentQuestion.type,
    );
    this.sessionXpGain += gainedXp;

    const metrics = buildDifficultyMetrics(submitResult.session, this.answers);
    const nextDifficulty = this.deps.difficultyController.adjustLevel(submitResult.session.difficultyLevel, metrics);

    const nextSession: Session = {
      ...submitResult.session,
      difficultyLevel: nextDifficulty,
    };

    this.deps.analytics.track(gameEvents.questionAnswered, {
      session_id: submitResult.session.id,
      mode: submitResult.session.mode,
      question_type: currentQuestion.type,
      is_correct: submitResult.answer.isCorrect,
      response_time_ms: submitResult.answer.responseTimeMs,
      combo: nextSession.combo,
      score: nextSession.score,
      difficulty: nextSession.difficultyLevel,
    });

    this.state = {
      ...this.state,
      session: nextSession,
      answerInput: '',
      lastAnswerCorrect: submitResult.answer.isCorrect,
    };

    const modePolicy = GAME_MODE_POLICIES[nextSession.mode];

    if (modePolicy.endsOnMistake && !submitResult.answer.isCorrect) {
      this.state = {
        ...this.state,
        currentQuestion: null,
      };
      this.finishSessionInternal('mistake');
      return true;
    }

    if (typeof nextSession.questionLimit === 'number' && nextSession.totalAnswers >= nextSession.questionLimit) {
      this.state = {
        ...this.state,
        currentQuestion: null,
      };
      this.finishSessionInternal(nextSession.mode === 'daily' ? 'daily_complete' : 'question_limit');
      return true;
    }

    const nextQuestion = this.questionGenerator?.generate(nextSession.difficultyLevel, nowMs) ?? null;
    this.state = {
      ...this.state,
      currentQuestion: nextQuestion,
    };

    this.emit();
    return true;
  }

  finishSession(reason: SessionFinishReason = 'manual'): void {
    if (this.state.phase !== 'running') {
      return;
    }

    this.finishSessionInternal(reason);
  }

  resetToIdle(): void {
    const modePolicy = GAME_MODE_POLICIES[this.sessionConfig.mode];
    const durationSeconds = resolveSessionDurationSeconds(this.sessionConfig, this.deps.env);

    this.state = {
      ...this.state,
      phase: 'idle',
      session: null,
      currentQuestion: null,
      answerInput: '',
      remainingMs: modePolicy.timed ? durationSeconds * 1000 : 0,
      lastAnswerCorrect: null,
      summary: null,
    };

    this.emit();
  }

  private finishSessionInternal(reason: SessionFinishReason): void {
    const session = this.state.session;
    if (!session) {
      return;
    }

    const endedAt = this.now();

    const sessionSummary = this.endSessionUseCase.execute(session, endedAt);
    const levelBefore = this.state.player.level;
    const totalXp = this.state.player.xp + this.sessionXpGain;
    const levelAfter = levelFromXp(totalXp);
    const averageResponseTimeMs = averageResponseTime(this.answers);
    const questionTypeStats = buildSessionQuestionTypeStats(this.answers);

    const summary: GameSessionSummary = {
      sessionId: sessionSummary.sessionId,
      mode: sessionSummary.mode,
      questionTypes: sessionSummary.questionTypes,
      score: sessionSummary.score,
      accuracyRate: sessionSummary.accuracyRate,
      correctAnswers: session.correctAnswers,
      totalAnswers: session.totalAnswers,
      bestCombo: sessionSummary.bestCombo,
      durationSeconds: sessionSummary.durationSeconds,
      averageResponseTimeMs,
      questionTypeStats,
      endedAt: sessionSummary.endedAt,
      gainedXp: this.sessionXpGain,
      totalXp,
      levelBefore,
      levelAfter,
      reason,
    };

    this.state = {
      ...this.state,
      phase: 'finished',
      session: {
        ...session,
        endedAt,
      },
      currentQuestion: null,
      answerInput: '',
      remainingMs: 0,
      summary,
      player: {
        xp: totalXp,
        level: levelAfter,
      },
    };

    this.deps.analytics.track(gameEvents.sessionEnd, {
      session_id: summary.sessionId,
      mode: summary.mode,
      reason,
      score: summary.score,
      correct_answers: summary.correctAnswers,
      total_answers: summary.totalAnswers,
      best_combo: summary.bestCombo,
      gained_xp: summary.gainedXp,
      level_after: summary.levelAfter,
      average_response_time_ms: summary.averageResponseTimeMs,
      question_types: summary.questionTypes.join(','),
    });

    this.deps.analytics.track(gameEvents.accuracy, {
      session_id: summary.sessionId,
      mode: summary.mode,
      value: summary.accuracyRate,
    });

    this.deps.analytics.track(gameEvents.streak, {
      session_id: summary.sessionId,
      mode: summary.mode,
      value: summary.bestCombo,
    });

    this.deps.analytics.track(gameEvents.sessionLength, {
      session_id: summary.sessionId,
      mode: summary.mode,
      value: summary.durationSeconds,
    });

    if (summary.mode === 'daily' && summary.reason === 'daily_complete') {
      this.deps.analytics.track(gameEvents.dailyChallengeCompleted, {
        session_id: summary.sessionId,
        score: summary.score,
        total_answers: summary.totalAnswers,
        correct_answers: summary.correctAnswers,
      });
    }

    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

function normalizePlayer(player: PlayerProgress): PlayerProgress {
  const xp = Math.max(0, Math.floor(player.xp));
  return {
    xp,
    level: levelFromXp(xp),
  };
}

function calculateXpForAnswer(
  isCorrect: boolean,
  combo: number,
  difficultyLevel: number,
  type: QuestionType,
): number {
  if (!isCorrect) {
    return 0;
  }

  const comboBonus = Math.max(0, combo - 1) * 2;
  const difficultyBonus = Math.floor(difficultyLevel / 2);
  const operationBonus = type === 'multiplication' || type === 'division' ? 3 : 0;
  return 10 + comboBonus + difficultyBonus + operationBonus;
}

function buildDifficultyMetrics(session: Session, answers: Answer[]): {
  accuracyRate: number;
  averageResponseTimeMs: number;
  streakLength: number;
  repeatedMistakes: number;
} {
  const accuracyRate = session.totalAnswers === 0 ? 0 : session.correctAnswers / session.totalAnswers;

  const averageResponseTimeMs =
    answers.length === 0
      ? 0
      : answers.reduce((total, item) => total + item.responseTimeMs, 0) / answers.length;

  return {
    accuracyRate,
    averageResponseTimeMs,
    streakLength: session.combo,
    repeatedMistakes: countTrailingIncorrect(answers),
  };
}

function countTrailingIncorrect(answers: Answer[]): number {
  let count = 0;

  for (let index = answers.length - 1; index >= 0; index -= 1) {
    if (answers[index].isCorrect) {
      break;
    }

    count += 1;
  }

  return count;
}

function averageResponseTime(answers: Answer[]): number {
  if (answers.length === 0) {
    return 0;
  }

  const average = answers.reduce((total, item) => total + item.responseTimeMs, 0) / answers.length;
  return Math.round(average);
}

function buildSessionQuestionTypeStats(answers: Answer[]): GameSessionSummary['questionTypeStats'] {
  const stats: GameSessionSummary['questionTypeStats'] = {};

  answers.forEach((answer) => {
    const current = stats[answer.questionType] ?? {
      answered: 0,
      correct: 0,
      averageResponseTimeMs: 0,
    };

    const answered = current.answered + 1;
    const correct = current.correct + (answer.isCorrect ? 1 : 0);
    const totalResponseTime = current.averageResponseTimeMs * current.answered + answer.responseTimeMs;

    stats[answer.questionType] = {
      answered,
      correct,
      averageResponseTimeMs: Math.round(totalResponseTime / answered),
    };
  });

  return stats;
}

function levelFromXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}

function normalizeSessionConfig(config: GameSessionConfig): GameSessionConfig {
  const uniqueTypes = Array.from(new Set<QuestionType>(config.allowedQuestionTypes));
  const fallbackTypes: QuestionType[] = ['addition', 'subtraction'];
  const allowedQuestionTypes: QuestionType[] = uniqueTypes.length > 0 ? uniqueTypes : fallbackTypes;

  return {
    mode: config.mode,
    allowedQuestionTypes,
    durationSecondsOverride: config.durationSecondsOverride,
    questionLimitOverride: config.questionLimitOverride,
    seedOverride: config.seedOverride,
  };
}

function resolveSessionDurationSeconds(config: GameSessionConfig, env: EnvConfig): number {
  if (typeof config.durationSecondsOverride === 'number' && Number.isFinite(config.durationSecondsOverride)) {
    return Math.max(0, Math.floor(config.durationSecondsOverride));
  }

  if (config.mode === 'sprint') {
    return env.sessionDurationSeconds;
  }

  return GAME_MODE_POLICIES[config.mode].defaultDurationSeconds;
}

function resolveQuestionLimit(config: GameSessionConfig): number | undefined {
  if (typeof config.questionLimitOverride === 'number' && Number.isFinite(config.questionLimitOverride)) {
    return Math.max(1, Math.floor(config.questionLimitOverride));
  }

  return GAME_MODE_POLICIES[config.mode].questionLimit;
}
