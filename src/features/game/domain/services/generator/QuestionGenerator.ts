import { SeededRandom } from '@core/utils/random';
import type { Question, QuestionType } from '@features/game/domain/entities/Question';

export interface QuestionGeneratorConfig {
  seed: number;
  allowedTypes?: QuestionType[];
}

export class QuestionGenerator {
  private readonly random: SeededRandom;
  private readonly allowedTypes: QuestionType[];
  private sequence = 0;

  constructor(config: QuestionGeneratorConfig) {
    this.random = new SeededRandom(config.seed);
    this.allowedTypes =
      config.allowedTypes && config.allowedTypes.length > 0
        ? config.allowedTypes
        : ['addition', 'subtraction'];
  }

  generate(difficultyLevel: number, now = Date.now()): Question {
    this.sequence += 1;

    const type = this.allowedTypes[this.random.nextInt(0, this.allowedTypes.length - 1)];
    const [left, right] = this.createOperands(type, difficultyLevel);

    const answer = calculateAnswer(type, left, right);
    const operator = getOperator(type);

    return {
      id: `q-${this.sequence}`,
      type,
      prompt: `${left} ${operator} ${right}`,
      operands: [left, right],
      answer,
      difficultyLevel,
      createdAt: now,
    };
  }

  private createOperands(type: QuestionType, difficultyLevel: number): [number, number] {
    const linearRangeMax = Math.min(200, 10 + difficultyLevel * 5);
    const linearRangeMin = Math.max(0, linearRangeMax - (12 + difficultyLevel * 2));

    if (type === 'addition' || type === 'subtraction') {
      let left = this.random.nextInt(linearRangeMin, linearRangeMax);
      let right = this.random.nextInt(linearRangeMin, linearRangeMax);

      if (type === 'subtraction' && right > left) {
        [left, right] = [right, left];
      }

      return [left, right];
    }

    if (type === 'multiplication') {
      const factorMax = Math.max(3, Math.min(16, 3 + Math.floor(difficultyLevel / 2)));
      const left = this.random.nextInt(2, factorMax + 4);
      const right = this.random.nextInt(2, factorMax);
      return [left, right];
    }

    const divisor = this.random.nextInt(2, Math.max(3, Math.min(12, 2 + Math.floor(difficultyLevel / 3))));
    const quotient = this.random.nextInt(2, Math.max(4, Math.min(20, 3 + Math.floor(difficultyLevel / 2))));
    const dividend = divisor * quotient;
    return [dividend, divisor];
  }
}

function getOperator(type: QuestionType): string {
  switch (type) {
    case 'addition':
      return '+';
    case 'subtraction':
      return '-';
    case 'multiplication':
      return '×';
    case 'division':
      return '÷';
    default:
      return '?';
  }
}

function calculateAnswer(type: QuestionType, left: number, right: number): number {
  switch (type) {
    case 'addition':
      return left + right;
    case 'subtraction':
      return left - right;
    case 'multiplication':
      return left * right;
    case 'division':
      return right === 0 ? 0 : Math.floor(left / right);
    default:
      return 0;
  }
}
