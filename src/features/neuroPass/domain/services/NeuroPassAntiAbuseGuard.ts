import { SpamTapDetector } from '@features/neuroPass/domain/antiAbuse/SpamTapDetector';
import { clampInt, clampNumber } from '@features/neuroPass/domain/utils/math';

export interface NeuroPassAntiSpamSignals {
  tapRatePerSecond?: number;
  invalidInputCount?: number;
  rapidRepeatWrongCount?: number;
  spamFlags?: number;
  submissionTimestampsMs?: number[];
  tapTimestampsMs?: number[];
  repeatedIdenticalInputFastCount?: number;
  identicalInputBurstCount?: number;
}

export interface NeuroPassAntiAbuseEvaluation {
  spamScore: number;
  penalty: number;
}

export class NeuroPassAntiAbuseGuard {
  constructor(private readonly spamTapDetector: SpamTapDetector = new SpamTapDetector()) {}

  evaluate(signals: NeuroPassAntiSpamSignals): NeuroPassAntiAbuseEvaluation {
    const detector = this.spamTapDetector.detect({
      submissionTimestampsMs: signals.submissionTimestampsMs,
      tapTimestampsMs: signals.tapTimestampsMs,
      repeatedIdenticalInputFastCount: signals.repeatedIdenticalInputFastCount,
      identicalInputBurstCount: signals.identicalInputBurstCount,
    });

    const heuristicPenalty = this.computeLegacyHeuristicPenalty(signals);
    const heuristicScore = clampNumber(heuristicPenalty / 60, 0, 1);
    const spamScore = clampNumber(
      Math.max(detector.spamScore, heuristicScore, detector.spamScore * 0.6 + heuristicScore * 0.5),
      0,
      1,
    );

    return {
      spamScore,
      penalty: clampInt(Math.round(spamScore * 60), 0, 60),
    };
  }

  computeAntiSpamPenalty(signals: NeuroPassAntiSpamSignals): number {
    return this.evaluate(signals).penalty;
  }

  private computeLegacyHeuristicPenalty(signals: NeuroPassAntiSpamSignals): number {
    const tapRate = Number(signals.tapRatePerSecond ?? 0);
    const invalidCount = Math.max(0, Math.floor(Number(signals.invalidInputCount ?? 0)));
    const repeatedWrong = Math.max(0, Math.floor(Number(signals.rapidRepeatWrongCount ?? 0)));
    const spamFlags = Math.max(0, Math.floor(Number(signals.spamFlags ?? 0)));

    let penalty = 0;

    if (tapRate > 9) {
      penalty += Math.min(20, Math.round((tapRate - 9) * 4));
    }

    penalty += Math.min(20, invalidCount * 2);
    penalty += Math.min(20, repeatedWrong * 4);
    penalty += Math.min(15, spamFlags * 5);

    return clampInt(penalty, 0, 60);
  }
}
