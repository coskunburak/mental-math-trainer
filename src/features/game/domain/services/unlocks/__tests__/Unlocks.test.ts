import { computeUnlockState, isModeUnlocked } from '../Unlocks';

describe('Unlocks', () => {
  it('starts with daily, sprint, custom and basic operations at level 1', () => {
    const unlocks = computeUnlockState(1);

    expect(unlocks.unlockedModes).toEqual(['daily', 'sprint', 'custom']);
    expect(unlocks.unlockedQuestionTypes).toEqual(['addition', 'subtraction']);
    expect(unlocks.canUseMixedOperations).toBe(false);
  });

  it('unlocks zen and multiplication at expected levels', () => {
    const level3 = computeUnlockState(3);

    expect(level3.unlockedModes).toContain('zen');
    expect(level3.unlockedQuestionTypes).toContain('multiplication');
    expect(level3.canUseMixedOperations).toBe(true);
  });

  it('unlocks survival and division at higher levels', () => {
    const level5 = computeUnlockState(5);

    expect(level5.unlockedModes).toEqual(
      expect.arrayContaining(['daily', 'sprint', 'custom', 'zen', 'survival']),
    );
    expect(level5.unlockedQuestionTypes).toEqual(
      expect.arrayContaining(['addition', 'subtraction', 'multiplication', 'division']),
    );
    expect(isModeUnlocked(5, 'survival')).toBe(true);
  });

  it('unlocks neuro fusion at level 6', () => {
    const level6 = computeUnlockState(6);
    expect(level6.unlockedModes).toContain('neuro_fusion');
    expect(isModeUnlocked(6, 'neuro_fusion')).toBe(true);
  });
});
