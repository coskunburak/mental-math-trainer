import { QuestionGenerator } from '@features/game/domain/services/generator/QuestionGenerator';

describe('QuestionGenerator', () => {
  it('produces deterministic questions for the same seed', () => {
    const generatorA = new QuestionGenerator({ seed: 42 });
    const generatorB = new QuestionGenerator({ seed: 42 });

    const questionsA = Array.from({ length: 12 }, (_, index) => generatorA.generate(4, 1000 + index));
    const questionsB = Array.from({ length: 12 }, (_, index) => generatorB.generate(4, 1000 + index));

    expect(questionsA).toEqual(questionsB);
  });

  it('keeps subtraction answers non-negative', () => {
    const generator = new QuestionGenerator({
      seed: 7,
      allowedTypes: ['subtraction'],
    });

    const questions = Array.from({ length: 30 }, () => generator.generate(5));

    questions.forEach((question) => {
      expect(question.operands[0]).toBeGreaterThanOrEqual(question.operands[1]);
      expect(question.answer).toBeGreaterThanOrEqual(0);
    });
  });

  it('generates valid multiplication prompts and answers', () => {
    const generator = new QuestionGenerator({
      seed: 11,
      allowedTypes: ['multiplication'],
    });

    const questions = Array.from({ length: 20 }, (_, index) => generator.generate(8, 2000 + index));

    questions.forEach((question) => {
      expect(question.type).toBe('multiplication');
      expect(question.prompt.includes('×')).toBe(true);
      expect(question.answer).toBe(question.operands[0] * question.operands[1]);
    });
  });

  it('generates exact integer division questions', () => {
    const generator = new QuestionGenerator({
      seed: 19,
      allowedTypes: ['division'],
    });

    const questions = Array.from({ length: 24 }, () => generator.generate(10));

    questions.forEach((question) => {
      expect(question.type).toBe('division');
      expect(question.prompt.includes('÷')).toBe(true);
      expect(question.operands[1]).toBeGreaterThan(0);
      expect(question.operands[0] % question.operands[1]).toBe(0);
      expect(question.answer).toBe(question.operands[0] / question.operands[1]);
    });
  });
});
