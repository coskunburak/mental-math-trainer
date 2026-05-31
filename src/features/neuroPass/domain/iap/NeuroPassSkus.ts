export const NEURO_PASS_TIER_SKIP_5_SKU = 'neuro_pass_tier_skip_5';

function normalizeSeasonToken(seasonId: string): string {
  const normalized = seasonId.trim().toLowerCase();

  if (normalized.startsWith('neuro_pass_')) {
    return normalized;
  }

  if (normalized.startsWith('s')) {
    return `neuro_pass_${normalized}`;
  }

  return `neuro_pass_s${normalized}`;
}

export class NeuroPassSkuBuilder {
  buildStandardSku(seasonId: string): string {
    return `${normalizeSeasonToken(seasonId)}_standard`;
  }

  buildPlusSku(seasonId: string): string {
    return `${normalizeSeasonToken(seasonId)}_plus`;
  }

  get tierSkipSku5(): string {
    return NEURO_PASS_TIER_SKIP_5_SKU;
  }
}
