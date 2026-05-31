import { makeClaimKey, makeXpGrantIdFromRun } from '@features/neuroPass/domain/idempotency/keys';

describe('Neuro Pass idempotency keys', () => {
  it('uses runId directly for xp grants', () => {
    expect(makeXpGrantIdFromRun(' run_123 ')).toBe('run_123');
  });

  it('builds stable claim keys from season:tier:track', () => {
    expect(makeClaimKey('neuro_pass_s1', 17, 'premium')).toBe('neuro_pass_s1:17:premium');
    expect(makeClaimKey('neuro_pass_s1', 1, 'free')).toBe('neuro_pass_s1:1:free');
  });
});
