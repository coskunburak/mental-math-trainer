import type {
  NeuroFusionBeatAccuracy,
  NeuroFusionChallengeKind,
  NeuroFusionConfig,
} from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';

export interface NeuroFusionScoringInput {
  kind: NeuroFusionChallengeKind;
  isCorrect: boolean;
  beatAccuracy: NeuroFusionBeatAccuracy;
  responseTimeMs: number;
  combo: number;
  insightMultiplier: number;
  difficultyTier: number;
  isBoss: boolean;
  spamDetected: boolean;
  currentFlow: number;
}

export interface NeuroFusionScoringOutput {
  scoreDelta: number;
  flowDelta: number;
  comboAfter: number;
}

export class NeuroFusionScoringService {
  constructor(private readonly config: NeuroFusionConfig) {}

  score(input: NeuroFusionScoringInput): NeuroFusionScoringOutput {
    if (!input.isCorrect) {
      const spamPenalty = input.spamDetected ? this.config.scoring.spamPenalty : 0;
      const penalty = this.config.scoring.wrongPenalty + spamPenalty;

      return {
        scoreDelta: -Math.max(0, penalty),
        flowDelta: -(this.config.flow.lossWrong + (input.spamDetected ? this.config.flow.lossSpam : 0)),
        comboAfter: 0,
      };
    }

    const comboAfter = input.combo + 1;
    const base = basePointsByKind(input.kind, this.config) + input.difficultyTier * 3;
    const speed = speedBonus(input.responseTimeMs, this.config.scoring.speedBonusMax);
    const beatMultiplier = 1 + beatBonus(input.beatAccuracy, this.config);
    const comboMultiplier = 1 + Math.min(comboAfter, this.config.scoring.comboCap) * this.config.scoring.comboStep;
    const insight = Math.max(1, input.insightMultiplier);
    const bossMultiplier = input.isBoss ? this.config.scoring.bossMultiplier : 1;

    let scoreDelta = Math.round((base + speed) * beatMultiplier * comboMultiplier * insight * bossMultiplier);

    if (input.beatAccuracy === 'offbeat') {
      scoreDelta -= this.config.scoring.offbeatPenalty;
    }

    if (input.spamDetected) {
      scoreDelta -= this.config.scoring.spamPenalty;
    }

    const flowDelta =
      flowGain(input.beatAccuracy, this.config) +
      this.config.flow.gainCorrect -
      (input.spamDetected ? this.config.flow.lossSpam : 0);

    return {
      scoreDelta,
      flowDelta,
      comboAfter,
    };
  }
}

function basePointsByKind(kind: NeuroFusionChallengeKind, config: NeuroFusionConfig): number {
  switch (kind) {
    case 'rhythm_question':
      return config.scoring.rhythmBase;
    case 'puzzle':
      return config.scoring.puzzleBase;
    case 'memory_stack':
      return config.scoring.memoryBase;
    case 'reaction_gate':
      return config.scoring.reactionBase;
    default:
      return config.scoring.rhythmBase;
  }
}

function beatBonus(accuracy: NeuroFusionBeatAccuracy, config: NeuroFusionConfig): number {
  switch (accuracy) {
    case 'perfect':
      return config.scoring.perfectBonus;
    case 'great':
      return config.scoring.greatBonus;
    case 'good':
      return config.scoring.goodBonus;
    case 'offbeat':
      return config.scoring.offbeatBonus;
    default:
      return 0;
  }
}

function flowGain(accuracy: NeuroFusionBeatAccuracy, config: NeuroFusionConfig): number {
  switch (accuracy) {
    case 'perfect':
      return config.flow.gainPerfect;
    case 'great':
      return config.flow.gainGreat;
    case 'good':
      return config.flow.gainGood;
    case 'offbeat':
      return 0;
    default:
      return 0;
  }
}

function speedBonus(responseTimeMs: number, maxBonus: number): number {
  const capped = Math.max(0, Math.min(5_000, responseTimeMs));
  const ratio = 1 - capped / 5_000;
  return Math.round(Math.max(0, maxBonus * ratio));
}
