export type NeuroPassSuspiciousTimeMode = 'none' | 'clamp_to_min';

export interface NeuroPassSecurityConfig {
  replayIndexLookbackDays: number;
  suspiciousBackwardJumpMs: number;
  suspiciousForwardJumpMs: number;
  suspiciousClockDriftMs: number;
  suspiciousStabilizeSamples: number;
  suspiciousTimeMode: NeuroPassSuspiciousTimeMode;
  anomalyDailyNxpThreshold: number;
  anomalyRunReductionEnabled: boolean;
  anomalyRunReductionMultiplier: number;
}

export const DEFAULT_NEURO_PASS_SECURITY_CONFIG: NeuroPassSecurityConfig = {
  replayIndexLookbackDays: 45,
  suspiciousBackwardJumpMs: 5 * 60 * 1000,
  suspiciousForwardJumpMs: 2 * 60 * 60 * 1000,
  suspiciousClockDriftMs: 12 * 60 * 1000,
  suspiciousStabilizeSamples: 3,
  suspiciousTimeMode: 'clamp_to_min',
  anomalyDailyNxpThreshold: 2500,
  anomalyRunReductionEnabled: true,
  anomalyRunReductionMultiplier: 0.75,
};
