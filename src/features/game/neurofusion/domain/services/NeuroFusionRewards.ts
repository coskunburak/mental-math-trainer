import type {
  NeuroFusionConfig,
  NeuroFusionGrade,
  NeuroFusionRewardBundle,
  NeuroFusionRunState,
} from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';

export function gradeRun(state: NeuroFusionRunState, config: NeuroFusionConfig): NeuroFusionGrade {
  const accuracy = state.progress.totalAnswers === 0
    ? 0
    : state.progress.correctAnswers / state.progress.totalAnswers;
  const averageOffset = state.progress.beatOffsetSamples === 0
    ? 9_999
    : Math.abs(state.progress.averageBeatOffsetMs);

  for (const threshold of config.gradeThresholds) {
    if (
      state.progress.score >= threshold.minScore &&
      accuracy >= threshold.minAccuracy &&
      averageOffset <= threshold.maxAverageBeatOffsetMs
    ) {
      return threshold.grade;
    }
  }

  return 'C';
}

export function buildRewardBundle(
  state: NeuroFusionRunState,
  grade: NeuroFusionGrade,
): NeuroFusionRewardBundle {
  const score = state.progress.score;
  const combo = state.progress.bestCombo;
  const flowPeak = state.flowPeak;

  const xp = Math.round(
    80 + score * 0.055 + combo * 2.5 + gradeFlatBonus(grade, { S: 60, A: 35, B: 15, C: 0 }),
  );
  const coins = Math.round(
    20 + score * 0.02 + combo * 1.3 + gradeFlatBonus(grade, { S: 30, A: 20, B: 12, C: 8 }),
  );
  const trackFragments = Math.max(
    1,
    Math.round(
      1 + Math.floor(flowPeak / 25) + gradeFlatBonus(grade, { S: 2, A: 1, B: 1, C: 0 }),
    ),
  );
  const weeklyLeaguePoints = Math.round(
    40 + score / 25 + gradeFlatBonus(grade, { S: 25, A: 15, B: 10, C: 5 }),
  );

  const badges = collectBadges(state, grade);

  return {
    tier: grade,
    xp,
    coins,
    trackFragments,
    weeklyLeaguePoints,
    badges,
  };
}

function gradeFlatBonus(
  grade: NeuroFusionGrade,
  mapping: Record<NeuroFusionGrade, number>,
): number {
  return mapping[grade] ?? 0;
}

function collectBadges(state: NeuroFusionRunState, grade: NeuroFusionGrade): string[] {
  const badges: string[] = [];

  if (state.progress.bestCombo >= 18) {
    badges.push('Perfect Streak');
  }

  const puzzle = state.phaseBreakdown.puzzle;
  if (puzzle.total >= 6 && puzzle.correct / Math.max(1, puzzle.total) >= 0.85) {
    badges.push('Puzzle Master');
  }

  const reaction = state.phaseBreakdown.cognitive_blend;
  if (reaction.total >= 8 && reaction.correct / Math.max(1, reaction.total) >= 0.8) {
    badges.push('Reflex King');
  }

  const memoryMomentum = state.phaseBreakdown.boss.correct + state.phaseBreakdown.cognitive_blend.correct;
  if (memoryMomentum >= 10) {
    badges.push('Echo Memory');
  }

  if (grade === 'S') {
    badges.push('Neuro Fusion S-tier');
  }

  return badges;
}
