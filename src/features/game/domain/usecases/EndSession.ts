import type { GameSessionSummary } from '@features/game/domain/entities/ProgressModels';
import type { Session } from '@features/game/domain/entities/Session';

export class EndSession {
  execute(
    session: Session,
    endedAt: number,
  ): Omit<
    GameSessionSummary,
    | 'correctAnswers'
    | 'totalAnswers'
    | 'averageResponseTimeMs'
    | 'questionTypeStats'
    | 'gainedXp'
    | 'totalXp'
    | 'levelBefore'
    | 'levelAfter'
    | 'reason'
  > {
    const accuracyRate = session.totalAnswers === 0 ? 0 : session.correctAnswers / session.totalAnswers;
    const actualDurationSeconds = Math.max(1, Math.round((endedAt - session.startedAt) / 1000));

    return {
      sessionId: session.id,
      mode: session.mode,
      questionTypes: session.questionTypes,
      score: session.score,
      accuracyRate,
      bestCombo: session.bestCombo,
      durationSeconds: actualDurationSeconds,
      endedAt,
    };
  }
}
