export const neuroFusionGoldenFixture = {
  seed: 20260220,
  startedAtMs: 5_000,
  expectedFirstFingerprints: [
    'r:17 - 4',
    'r:26 - 4',
    'r:4 × 5',
    'p:grid_mini:[3  6]\n[9  ?]:12',
    'p:quick_estimate:Nearest estimate for 17 + 59?:80',
    'p:equation_balance:__ + 7 = 8:1',
  ],
  expectedFinalScore: 1742,
  expectedFinalGrade: 'C',
} as const;
