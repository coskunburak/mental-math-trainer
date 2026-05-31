export interface NeuroPassProgress {
  currentNxp: number;
  currentTier: number;
  tierProgressPct: number;
  lastUpdatedAtUtc: string;
}

export function buildNeuroPassProgress(input: {
  currentNxp: number;
  lastUpdatedAtUtc: string;
  xpPerTier: number;
  tiersTotal: number;
}): NeuroPassProgress {
  const normalizedNxp = Math.max(0, Math.floor(input.currentNxp));
  const xpPerTier = Math.max(1, Math.floor(input.xpPerTier));
  const tiersTotal = Math.max(1, Math.floor(input.tiersTotal));
  const currentTier = Math.min(tiersTotal, Math.floor(normalizedNxp / xpPerTier) + 1);
  const tierProgressPct = (normalizedNxp % xpPerTier) / xpPerTier;

  return {
    currentNxp: normalizedNxp,
    currentTier,
    tierProgressPct,
    lastUpdatedAtUtc: input.lastUpdatedAtUtc,
  };
}

export const DEFAULT_NEURO_PASS_PROGRESS: NeuroPassProgress = buildNeuroPassProgress({
  currentNxp: 0,
  lastUpdatedAtUtc: new Date(0).toISOString(),
  xpPerTier: 500,
  tiersTotal: 40,
});
