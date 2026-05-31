import { NeuroPassEconomyPolicy } from '@features/neuroPass/domain/policies/NeuroPassEconomyPolicy';
import { NeuroPassAntiAbuseGuard } from '@features/neuroPass/domain/services/NeuroPassAntiAbuseGuard';

describe('NeuroPassEconomyPolicy', () => {
  const policy = new NeuroPassEconomyPolicy();

  it('maps grade base exactly', () => {
    expect(policy.gradeBase('C')).toBe(90);
    expect(policy.gradeBase('B')).toBe(120);
    expect(policy.gradeBase('A')).toBe(150);
    expect(policy.gradeBase('S')).toBe(180);
  });

  it('clamps run base NXP into 60..260', () => {
    expect(
      policy.computeRunBaseNxp({
        grade: 'C',
        rhythmBonus: 0,
        comboBonus: 0,
        phaseDiversityBonus: 0,
        antiSpamPenalty: 60,
      }),
    ).toBe(60);

    expect(
      policy.computeRunBaseNxp({
        grade: 'S',
        rhythmBonus: 40,
        comboBonus: 25,
        phaseDiversityBonus: 10,
        antiSpamPenalty: 0,
      }),
    ).toBe(255);

    expect(
      policy.computeRunBaseNxp({
        grade: 'S',
        rhythmBonus: 80,
        comboBonus: 60,
        phaseDiversityBonus: 40,
        antiSpamPenalty: 0,
      }),
    ).toBe(255);
  });

  it('applies phase diversity bonus only when all phases played and accuracy >= 0.75', () => {
    expect(policy.computePhaseDiversityBonus({ accuracy: 0.75, playedAllFourPhases: true })).toBe(10);
    expect(policy.computePhaseDiversityBonus({ accuracy: 0.74, playedAllFourPhases: true })).toBe(0);
    expect(policy.computePhaseDiversityBonus({ accuracy: 0.9, playedAllFourPhases: false })).toBe(0);
  });
});

describe('NeuroPassAntiAbuseGuard', () => {
  const guard = new NeuroPassAntiAbuseGuard();

  it('keeps penalty within deterministic 0..60 bounds', () => {
    expect(
      guard.computeAntiSpamPenalty({
        tapRatePerSecond: 3,
        invalidInputCount: 0,
        rapidRepeatWrongCount: 0,
        spamFlags: 0,
      }),
    ).toBe(0);

    expect(
      guard.computeAntiSpamPenalty({
        tapRatePerSecond: 50,
        invalidInputCount: 999,
        rapidRepeatWrongCount: 999,
        spamFlags: 999,
      }),
    ).toBe(60);
  });
});
