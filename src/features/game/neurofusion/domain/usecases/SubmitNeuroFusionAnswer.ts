import type {
  NeuroFusionAnswerEvaluation,
  NeuroFusionSubmissionInput,
} from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';
import { NeuroFusionRunEngine } from '@features/game/neurofusion/domain/services/NeuroFusionRunEngine';

export class SubmitNeuroFusionAnswer {
  constructor(private readonly engine: NeuroFusionRunEngine) {}

  execute(input: NeuroFusionSubmissionInput): NeuroFusionAnswerEvaluation | null {
    return this.engine.submitAnswer(input);
  }
}
