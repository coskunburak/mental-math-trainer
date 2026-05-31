import type { KeyValueStore } from '@core/storage/KeyValueStore';
import { storageKeys } from '@core/storage/storageKeys';
import type { AnswerEvent, OperationType } from '@features/game/domain/entities/AnswerEvent';
import type { AnswerEventRepository } from '@features/game/domain/repositories/AnswerEventRepository';

const CURRENT_SCHEMA_VERSION = 1;
const MAX_STORED_EVENTS = 20_000;

interface PersistedPayload {
  schemaVersion: number;
  events: unknown;
}

export class AnswerEventStore implements AnswerEventRepository {
  constructor(private readonly storage: KeyValueStore) {}

  async append(event: AnswerEvent): Promise<void> {
    await this.appendMany([event]);
  }

  async appendMany(events: readonly AnswerEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const existing = await this.loadEvents();
    const merged = [...existing, ...events]
      .map((event) => normalizeEvent(event))
      .sort((left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt));

    const deduped = dedupeByQuestionAndSession(merged);
    const trimmed = deduped.slice(Math.max(0, deduped.length - MAX_STORED_EVENTS));

    await this.storage.setString(
      storageKeys.answerEvents,
      JSON.stringify({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        events: trimmed,
      }),
    );
  }

  async listAll(): Promise<AnswerEvent[]> {
    return this.loadEvents();
  }

  async listBetween(startedAtIso: string, endedAtIso: string): Promise<AnswerEvent[]> {
    const startMs = Date.parse(startedAtIso);
    const endMs = Date.parse(endedAtIso);

    const all = await this.loadEvents();

    return all.filter((event) => {
      const eventMs = Date.parse(event.occurredAt);
      return eventMs >= startMs && eventMs <= endMs;
    });
  }

  private async loadEvents(): Promise<AnswerEvent[]> {
    const raw = await this.storage.getString(storageKeys.answerEvents);

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as PersistedPayload;
      if (!parsed || parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        return [];
      }

      if (!Array.isArray(parsed.events)) {
        return [];
      }

      return parsed.events
        .map((event) => coerceEvent(event))
        .filter((event): event is AnswerEvent => Boolean(event))
        .sort((left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt));
    } catch {
      return [];
    }
  }
}

function dedupeByQuestionAndSession(events: readonly AnswerEvent[]): AnswerEvent[] {
  const seen = new Set<string>();
  const result: AnswerEvent[] = [];

  for (const event of events) {
    const key = `${event.sessionId}|${event.questionId}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(event);
  }

  return result;
}

function coerceEvent(value: unknown): AnswerEvent | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const event = value as Partial<AnswerEvent>;
  if (typeof event.occurredAt !== 'string') {
    return null;
  }

  if (!isOperationType(event.operationType)) {
    return null;
  }

  if (typeof event.sessionId !== 'string' || typeof event.questionId !== 'string') {
    return null;
  }

  return normalizeEvent({
    occurredAt: event.occurredAt,
    operationType: event.operationType,
    difficultyTier: Number(event.difficultyTier ?? 1),
    stepCount: Number(event.stepCount ?? 1),
    isCorrect: Boolean(event.isCorrect),
    responseTimeMs: Number(event.responseTimeMs ?? 0),
    sessionId: event.sessionId,
    questionId: event.questionId,
  });
}

function normalizeEvent(event: AnswerEvent): AnswerEvent {
  return {
    occurredAt: new Date(event.occurredAt).toISOString(),
    operationType: event.operationType,
    difficultyTier: Math.max(1, Math.round(event.difficultyTier)),
    stepCount: Math.max(1, Math.round(event.stepCount)),
    isCorrect: event.isCorrect,
    responseTimeMs: Math.max(0, Math.round(event.responseTimeMs)),
    sessionId: event.sessionId,
    questionId: event.questionId,
  };
}

function isOperationType(value: unknown): value is OperationType {
  return (
    value === 'add'
    || value === 'sub'
    || value === 'mul'
    || value === 'div'
    || value === 'mixed'
    || value === 'sequence'
    || value === 'missingNumber'
  );
}
