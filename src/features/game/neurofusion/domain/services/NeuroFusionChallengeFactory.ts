import { SeededRandom } from '@core/utils/random';
import type {
  NeuroFusionChallengeItem,
  NeuroFusionChallengeKind,
  NeuroFusionConfig,
  NeuroFusionMemoryStep,
  NeuroFusionPhase,
  NeuroFusionPuzzle,
  NeuroFusionPuzzleType,
} from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';

interface BuildItemInput {
  phase: NeuroFusionPhase;
  beatIndex: number;
  sequence: number;
  difficultyTier: number;
  beatsPerQuestion: number;
  reactionWindowMs: number;
  memorySteps: number;
  hintEnabled: boolean;
  bossForcedKind?: NeuroFusionChallengeKind;
  puzzleStats: Record<NeuroFusionPuzzleType, { correct: number; total: number }>;
  lastPuzzleTypes: NeuroFusionPuzzleType[];
  cognitiveToggle: 'echo_stack' | 'reflex_gate';
}

export class NeuroFusionChallengeFactory {
  private readonly random: SeededRandom;

  constructor(seed: number, private readonly config: NeuroFusionConfig) {
    this.random = new SeededRandom(seed);
  }

  build(input: BuildItemInput): NeuroFusionChallengeItem {
    const difficultyTier = clamp(input.difficultyTier, this.config.minDifficultyTier, this.config.maxDifficultyTier);

    const kind =
      input.bossForcedKind ??
      kindByPhase(
        input.phase.type,
        input.cognitiveToggle,
      );

    if (kind === 'rhythm_question') {
      return this.buildRhythmQuestion({
        ...input,
        difficultyTier,
      });
    }

    if (kind === 'puzzle') {
      return this.buildPuzzle({
        ...input,
        difficultyTier,
      });
    }

    if (kind === 'memory_stack') {
      return this.buildMemoryStack({
        ...input,
        difficultyTier,
      });
    }

    return this.buildReactionGate({
      ...input,
      difficultyTier,
    });
  }

  private buildRhythmQuestion(input: BuildItemInput): NeuroFusionChallengeItem {
    const operationPool = operationPoolByTier(input.difficultyTier);
    const operationType = operationPool[this.random.nextInt(0, operationPool.length - 1)];

    const [left, right] = createOperands(this.random, operationType, input.difficultyTier);
    const answer = evaluateBinary(operationType, left, right);

    const targetBeat = input.beatIndex + Math.max(1, input.beatsPerQuestion - 1);
    const expiresAtBeat = targetBeat + 1;

    return {
      id: `nf-rhythm-${input.sequence}`,
      kind: 'rhythm_question',
      phaseType: input.phase.type,
      phaseIndex: input.phase.index,
      difficultyTier: input.difficultyTier,
      startsAtBeat: input.beatIndex,
      targetBeat,
      expiresAtBeat,
      createdAtMs: 0,
      operationType,
      prompt: `${left} ${operatorSymbol(operationType)} ${right}`,
      answer,
      beatsPerQuestion: input.beatsPerQuestion,
    };
  }

  private buildPuzzle(input: BuildItemInput): NeuroFusionChallengeItem {
    const puzzleType = chooseWeightedPuzzleType(
      this.random,
      this.config,
      input.puzzleStats,
      input.lastPuzzleTypes,
    );
    const targetBeat = input.beatIndex + Math.max(1, Math.floor(this.config.puzzleTimeBeatsByTier[input.difficultyTier] / 2));
    const expiresAtBeat = input.beatIndex + this.config.puzzleTimeBeatsByTier[input.difficultyTier];

    const basePuzzle = buildPuzzleByType(this.random, puzzleType, input.difficultyTier, input.hintEnabled);

    const puzzle: NeuroFusionPuzzle = {
      id: `nf-puzzle-${input.sequence}`,
      kind: 'puzzle',
      phaseType: input.phase.type,
      phaseIndex: input.phase.index,
      difficultyTier: input.difficultyTier,
      startsAtBeat: input.beatIndex,
      targetBeat,
      expiresAtBeat,
      createdAtMs: 0,
      puzzleType,
      prompt: basePuzzle.prompt,
      hint: basePuzzle.hint,
      options: basePuzzle.options,
      correctOptionIndex: basePuzzle.correctOptionIndex,
      explanation: basePuzzle.explanation,
    };

    return puzzle;
  }

  private buildMemoryStack(input: BuildItemInput): NeuroFusionChallengeItem {
    const stepsCount = Math.max(2, input.memorySteps);
    const steps: NeuroFusionMemoryStep[] = Array.from({ length: stepsCount }, () => {
      const operator = memoryOperatorByTier(this.random, input.difficultyTier);
      const value = memoryOperand(this.random, operator, input.difficultyTier);
      return { operator, value };
    });

    const revealMode = this.random.next() > 0.5 ? 'base_first' : 'base_last';
    const baseNumber = this.random.nextInt(3 + input.difficultyTier, 18 + input.difficultyTier * 4);
    const answer = applyMemorySteps(baseNumber, steps);

    return {
      id: `nf-memory-${input.sequence}`,
      kind: 'memory_stack',
      cognitiveSubtype: 'echo_stack',
      phaseType: input.phase.type,
      phaseIndex: input.phase.index,
      difficultyTier: input.difficultyTier,
      startsAtBeat: input.beatIndex,
      targetBeat: input.beatIndex + Math.max(1, Math.floor((stepsCount + 2) / 2)),
      expiresAtBeat: input.beatIndex + Math.max(3, stepsCount + 2),
      createdAtMs: 0,
      baseNumber,
      revealMode,
      steps,
      prompt: `Echo Stack (${stepsCount}): ${steps
        .map((step) => `${step.operator}${step.value}`)
        .join('  ')}`,
      answer,
    };
  }

  private buildReactionGate(input: BuildItemInput): NeuroFusionChallengeItem {
    const gateType = this.random.next() > 0.5 ? 'true_false' : 'greater_than';

    if (gateType === 'true_false') {
      const left = this.random.nextInt(2 + input.difficultyTier, 9 + input.difficultyTier * 2);
      const right = this.random.nextInt(2, 8 + input.difficultyTier);
      const actual = left * right;
      const shouldBeCorrect = this.random.next() > 0.45;
      const shown = shouldBeCorrect
        ? actual
        : actual + this.random.nextInt(-3 - input.difficultyTier, 4 + input.difficultyTier);

      return {
        id: `nf-reaction-${input.sequence}`,
        kind: 'reaction_gate',
        cognitiveSubtype: 'reflex_gate',
        phaseType: input.phase.type,
        phaseIndex: input.phase.index,
        difficultyTier: input.difficultyTier,
        startsAtBeat: input.beatIndex,
        targetBeat: input.beatIndex + 1,
        expiresAtBeat: input.beatIndex + 2,
        createdAtMs: 0,
        gateType,
        prompt: `${left} × ${right} = ${shown}`,
        expected: shown === actual,
        reactionWindowMs: input.reactionWindowMs,
      };
    }

    const left = this.random.nextInt(4 + input.difficultyTier, 16 + input.difficultyTier * 3);
    const right = this.random.nextInt(2, 12 + input.difficultyTier);
    const threshold = this.random.nextInt(18, 45 + input.difficultyTier * 4);
    const sum = left + right;

    return {
      id: `nf-reaction-${input.sequence}`,
      kind: 'reaction_gate',
      cognitiveSubtype: 'reflex_gate',
      phaseType: input.phase.type,
      phaseIndex: input.phase.index,
      difficultyTier: input.difficultyTier,
      startsAtBeat: input.beatIndex,
      targetBeat: input.beatIndex + 1,
      expiresAtBeat: input.beatIndex + 2,
      createdAtMs: 0,
      gateType,
      prompt: `${left} + ${right} > ${threshold}`,
      expected: sum > threshold,
      reactionWindowMs: input.reactionWindowMs,
    };
  }
}

function kindByPhase(
  phaseType: NeuroFusionPhase['type'],
  cognitiveToggle: 'echo_stack' | 'reflex_gate',
): NeuroFusionChallengeKind {
  if (phaseType === 'rhythm_math') {
    return 'rhythm_question';
  }

  if (phaseType === 'puzzle') {
    return 'puzzle';
  }

  if (phaseType === 'cognitive_blend') {
    return cognitiveToggle === 'echo_stack' ? 'memory_stack' : 'reaction_gate';
  }

  return 'rhythm_question';
}

function operationPoolByTier(difficultyTier: number): Array<'addition' | 'subtraction' | 'multiplication' | 'division'> {
  if (difficultyTier <= 1) {
    return ['addition', 'subtraction'];
  }

  if (difficultyTier <= 3) {
    return ['addition', 'subtraction', 'multiplication'];
  }

  return ['addition', 'subtraction', 'multiplication', 'division'];
}

function createOperands(
  random: SeededRandom,
  operationType: 'addition' | 'subtraction' | 'multiplication' | 'division',
  difficultyTier: number,
): [number, number] {
  const span = 8 + difficultyTier * 6;

  if (operationType === 'addition') {
    return [random.nextInt(2, span), random.nextInt(2, span)];
  }

  if (operationType === 'subtraction') {
    const left = random.nextInt(span / 2, span + 6);
    const right = random.nextInt(2, left - 1);
    return [left, right];
  }

  if (operationType === 'multiplication') {
    const left = random.nextInt(2, 6 + difficultyTier * 2);
    const right = random.nextInt(2, 7 + difficultyTier);
    return [left, right];
  }

  const divisor = random.nextInt(2, 5 + difficultyTier);
  const quotient = random.nextInt(2, 6 + difficultyTier * 2);
  return [divisor * quotient, divisor];
}

function evaluateBinary(
  operationType: 'addition' | 'subtraction' | 'multiplication' | 'division',
  left: number,
  right: number,
): number {
  switch (operationType) {
    case 'addition':
      return left + right;
    case 'subtraction':
      return left - right;
    case 'multiplication':
      return left * right;
    case 'division':
      return Math.floor(left / right);
    default:
      return 0;
  }
}

function operatorSymbol(operationType: 'addition' | 'subtraction' | 'multiplication' | 'division'): string {
  switch (operationType) {
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

function chooseWeightedPuzzleType(
  random: SeededRandom,
  config: NeuroFusionConfig,
  puzzleStats: Record<NeuroFusionPuzzleType, { correct: number; total: number }>,
  lastPuzzleTypes: NeuroFusionPuzzleType[],
): NeuroFusionPuzzleType {
  const types = Object.keys(config.puzzleMix) as NeuroFusionPuzzleType[];

  const weighted = types.map((type) => {
    const base = config.puzzleMix[type] ?? 1;
    const stats = puzzleStats[type];
    const accuracy = stats.total === 0 ? 0.7 : stats.correct / stats.total;
    const weaknessBoost = 1 + Math.max(0, 0.9 - accuracy) * 0.9;
    const repetitionPenalty = lastPuzzleTypes.slice(-2).includes(type) ? 0.45 : 1;
    const weight = base * weaknessBoost * repetitionPenalty;

    return {
      type,
      weight: Math.max(0.01, weight),
    };
  });

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  const cursor = random.next() * totalWeight;

  let cumulative = 0;
  for (const item of weighted) {
    cumulative += item.weight;
    if (cursor <= cumulative) {
      return item.type;
    }
  }

  return weighted[weighted.length - 1].type;
}

function buildPuzzleByType(
  random: SeededRandom,
  puzzleType: NeuroFusionPuzzleType,
  difficultyTier: number,
  hintEnabled: boolean,
): Pick<NeuroFusionPuzzle, 'prompt' | 'hint' | 'options' | 'correctOptionIndex' | 'explanation'> {
  switch (puzzleType) {
    case 'missing_sequence':
      return createMissingSequencePuzzle(random, difficultyTier, hintEnabled);
    case 'mixed_operation_pattern':
      return createMixedOperationPuzzle(random, difficultyTier, hintEnabled);
    case 'grid_mini':
      return createGridPuzzle(random, difficultyTier, hintEnabled);
    case 'odd_one_out':
      return createOddOneOutPuzzle(random, difficultyTier, hintEnabled);
    case 'equation_balance':
      return createEquationBalancePuzzle(random, difficultyTier, hintEnabled);
    case 'quick_estimate':
      return createQuickEstimatePuzzle(random, difficultyTier, hintEnabled);
    default:
      return createMissingSequencePuzzle(random, difficultyTier, hintEnabled);
  }
}

function createMissingSequencePuzzle(
  random: SeededRandom,
  difficultyTier: number,
  hintEnabled: boolean,
) {
  const useMultiply = random.next() > 0.45;
  const start = random.nextInt(2, 6 + difficultyTier);
  const change = useMultiply ? random.nextInt(2, 3) : random.nextInt(2, 4 + difficultyTier);

  const values = [start];
  for (let index = 1; index < 5; index += 1) {
    const previous = values[index - 1];
    values.push(useMultiply ? previous * change : previous + change);
  }

  const correct = values[3];
  const prompt = `${values[0]}, ${values[1]}, ${values[2]}, ?, ${values[4]}`;

  const options = createNumericOptions(random, correct, Math.max(2, Math.floor(correct * 0.2)), 4);

  return {
    prompt,
    hint: hintEnabled ? (useMultiply ? 'Rule: same multiplier each step.' : 'Rule: add a constant each step.') : undefined,
    options,
    correctOptionIndex: options.indexOf(String(correct)),
    explanation: useMultiply ? `Pattern is ×${change} each step.` : `Pattern is +${change} each step.`,
  };
}

function createMixedOperationPuzzle(
  random: SeededRandom,
  difficultyTier: number,
  hintEnabled: boolean,
) {
  const start = random.nextInt(2, 7 + difficultyTier);
  const multiplier = random.nextInt(2, 3);
  const addend = random.nextInt(1, 4 + Math.floor(difficultyTier / 2));

  const second = start * multiplier + addend;
  const third = second * multiplier + addend;
  const correct = third * multiplier + addend;

  const prompt = `${start} → ${second} → ${third} → ?`;
  const options = createNumericOptions(random, correct, Math.max(2, addend * 2), 4);

  return {
    prompt,
    hint: hintEnabled ? 'Apply the same transform each jump.' : undefined,
    options,
    correctOptionIndex: options.indexOf(String(correct)),
    explanation: `Each step is ×${multiplier} then +${addend}.`,
  };
}

function createGridPuzzle(
  random: SeededRandom,
  difficultyTier: number,
  hintEnabled: boolean,
) {
  const base = random.nextInt(2, 12 + difficultyTier);
  const rowStep = random.nextInt(2, 5 + difficultyTier);
  const colStep = random.nextInt(2, 6 + difficultyTier);

  const topLeft = base;
  const topRight = base + colStep;
  const bottomLeft = base + rowStep;
  const correct = base + rowStep + colStep;

  const prompt = `[${topLeft}  ${topRight}]\n[${bottomLeft}  ?]`;
  const options = createNumericOptions(random, correct, Math.max(2, Math.floor((rowStep + colStep) / 2)), 4);

  return {
    prompt,
    hint: hintEnabled ? 'Rows and columns progress by fixed steps.' : undefined,
    options,
    correctOptionIndex: options.indexOf(String(correct)),
    explanation: `Right adds ${colStep}, down adds ${rowStep}.`,
  };
}

function createOddOneOutPuzzle(
  random: SeededRandom,
  difficultyTier: number,
  hintEnabled: boolean,
) {
  const base = random.nextInt(2, 5 + difficultyTier);
  const expressions = [
    `${base} + ${base}`,
    `${base + 1} + ${base + 1}`,
    `${base + 2} + ${base + 2}`,
    `${base + 3} + ${base + 3}`,
  ];

  const oddIndex = random.nextInt(0, 3);
  const broken = expressions[oddIndex];
  const brokenValue = evaluateExpression(broken) + random.nextInt(1, 3 + difficultyTier);

  const options = expressions.map((expression, index) => {
    const value = index === oddIndex ? brokenValue : evaluateExpression(expression);
    return `${expression} = ${value}`;
  });

  return {
    prompt: 'Which expression breaks the pattern?',
    hint: hintEnabled ? 'Three expressions follow a stable relation; one does not.' : undefined,
    options,
    correctOptionIndex: oddIndex,
    explanation: `Option ${oddIndex + 1} is inconsistent with the repeated pattern.`,
  };
}

function createEquationBalancePuzzle(
  random: SeededRandom,
  difficultyTier: number,
  hintEnabled: boolean,
) {
  const right = random.nextInt(8, 25 + difficultyTier * 3);
  const known = random.nextInt(3, 11 + difficultyTier);
  const correct = right - known;

  const prompt = `__ + ${known} = ${right}`;
  const options = createNumericOptions(random, correct, Math.max(2, Math.floor(known / 2)), 4);

  return {
    prompt,
    hint: hintEnabled ? 'Move terms mentally to isolate the blank.' : undefined,
    options,
    correctOptionIndex: options.indexOf(String(correct)),
    explanation: `Missing value is ${right} - ${known} = ${correct}.`,
  };
}

function createQuickEstimatePuzzle(
  random: SeededRandom,
  difficultyTier: number,
  hintEnabled: boolean,
) {
  const left = random.nextInt(12, 60 + difficultyTier * 6);
  const right = random.nextInt(10, 55 + difficultyTier * 5);
  const exact = left + right;
  const rounded = Math.round(exact / 10) * 10;

  const options = [
    rounded - 10,
    rounded,
    rounded + 10,
  ].map((value) => String(value));

  return {
    prompt: `Nearest estimate for ${left} + ${right}?`,
    hint: hintEnabled ? 'Round quickly, then pick the closest bucket.' : undefined,
    options,
    correctOptionIndex: options.indexOf(String(rounded)),
    explanation: `Exact is ${exact}, nearest ten is ${rounded}.`,
  };
}

function createNumericOptions(
  random: SeededRandom,
  correct: number,
  spread: number,
  total: number,
): string[] {
  const unique = new Set<number>([correct]);

  while (unique.size < total) {
    const delta = random.nextInt(-spread, spread);
    const candidate = Math.max(0, correct + (delta === 0 ? spread : delta));
    unique.add(candidate);
  }

  const values = Array.from(unique);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const nextIndex = random.nextInt(0, index);
    [values[index], values[nextIndex]] = [values[nextIndex], values[index]];
  }

  return values.map((item) => String(item));
}

function evaluateExpression(expression: string): number {
  const [left, , right] = expression.split(' ').map((item) => Number(item));
  return left + right;
}

function memoryOperatorByTier(
  random: SeededRandom,
  difficultyTier: number,
): NeuroFusionMemoryStep['operator'] {
  if (difficultyTier <= 2) {
    return random.next() > 0.5 ? '+' : '-';
  }

  const roll = random.next();
  if (roll < 0.4) {
    return '+';
  }

  if (roll < 0.8) {
    return '-';
  }

  return 'x';
}

function memoryOperand(
  random: SeededRandom,
  operator: NeuroFusionMemoryStep['operator'],
  difficultyTier: number,
): number {
  if (operator === 'x') {
    return random.nextInt(2, Math.min(4, 2 + Math.floor(difficultyTier / 2)));
  }

  return random.nextInt(1, 5 + difficultyTier);
}

function applyMemorySteps(baseNumber: number, steps: NeuroFusionMemoryStep[]): number {
  return steps.reduce((value, step) => {
    if (step.operator === '+') {
      return value + step.value;
    }

    if (step.operator === '-') {
      return value - step.value;
    }

    return value * step.value;
  }, baseNumber);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
