import type { NeuroPassXpLedgerRepository } from '@features/neuroPass/domain/repositories/NeuroPassXpLedgerRepository';
import { neuroPassXpSource } from '@features/neuroPass/domain/types/NeuroPassXpSource';
import { utcDayKey } from '@features/neuroPass/domain/utils/time';

export type NeuroPassDailyQuestState = 'available' | 'claimed';

export interface NeuroPassDailyQuest {
  id: string;
  title: string;
  description: string;
  rewardNxp: number;
  state: NeuroPassDailyQuestState;
}

interface DailyQuestDefinition {
  id: string;
  title: string;
  description: string;
}

const DAILY_QUESTS: DailyQuestDefinition[] = [
  {
    id: 'fusion_run_1',
    title: 'Fusion Pulse',
    description: 'Finish 1 Neuro Fusion run.',
  },
  {
    id: 'rhythm_focus_75',
    title: 'Beat Focus',
    description: 'Land 75%+ rhythm accuracy in a run.',
  },
  {
    id: 'boss_clear_1',
    title: 'Boss Circuit',
    description: 'Clear the Boss phase once today.',
  },
];

const DAILY_QUEST_REWARD_NXP = 120;

export class LoadDailyQuestsForToday {
  constructor(
    private readonly xpLedgerRepository: NeuroPassXpLedgerRepository,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async execute(): Promise<NeuroPassDailyQuest[]> {
    const nowUtc = new Date(this.now());
    const dayKey = utcDayKey(nowUtc);

    const grantChecks = await Promise.all(
      DAILY_QUESTS.map((quest) =>
        this.xpLedgerRepository.hasGrant(`${dayKey}:${quest.id}`, neuroPassXpSource.dailyQuest),
      ),
    );

    return DAILY_QUESTS.map((quest, index) => ({
      id: quest.id,
      title: quest.title,
      description: quest.description,
      rewardNxp: DAILY_QUEST_REWARD_NXP,
      state: grantChecks[index] ? 'claimed' : 'available',
    }));
  }
}
