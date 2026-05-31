import type { AnswerEvent } from '@features/game/domain/entities/AnswerEvent';

export interface AnswerEventRepository {
  append(event: AnswerEvent): Promise<void>;
  appendMany(events: readonly AnswerEvent[]): Promise<void>;
  listAll(): Promise<AnswerEvent[]>;
  listBetween(startedAtIso: string, endedAtIso: string): Promise<AnswerEvent[]>;
}
