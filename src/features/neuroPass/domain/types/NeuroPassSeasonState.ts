export type NeuroPassSeasonState = 'preseason' | 'active' | 'grace' | 'ended';

const DAY_MS = 24 * 60 * 60 * 1000;

export function classifyNeuroPassSeasonState(input: {
  nowUtc: Date;
  startAtUtc: Date;
  endAtUtc: Date;
  graceEndAtUtc: Date;
}): NeuroPassSeasonState {
  const { nowUtc, startAtUtc, endAtUtc, graceEndAtUtc } = input;
  const nowMs = nowUtc.getTime();

  if (nowMs < startAtUtc.getTime()) {
    return 'preseason';
  }

  if (nowMs < endAtUtc.getTime()) {
    return 'active';
  }

  if (nowMs < graceEndAtUtc.getTime()) {
    return 'grace';
  }

  return 'ended';
}

export function computeNeuroPassTimeLeftMs(input: {
  nowUtc: Date;
  state: NeuroPassSeasonState;
  startAtUtc: Date;
  endAtUtc: Date;
  graceEndAtUtc: Date;
}): number {
  const { nowUtc, state, startAtUtc, endAtUtc, graceEndAtUtc } = input;

  let targetMs = 0;

  if (state === 'active') {
    targetMs = endAtUtc.getTime();
  } else if (state === 'grace') {
    targetMs = graceEndAtUtc.getTime();
  } else if (state === 'preseason') {
    targetMs = startAtUtc.getTime();
  }

  if (targetMs <= 0) {
    return 0;
  }

  return Math.max(0, targetMs - nowUtc.getTime());
}

export function computeNeuroPassDayLeft(input: {
  nowUtc: Date;
  state: NeuroPassSeasonState;
  startAtUtc: Date;
  endAtUtc: Date;
  graceEndAtUtc: Date;
}): number {
  const leftMs = computeNeuroPassTimeLeftMs(input);
  if (leftMs <= 0) {
    return 0;
  }

  return Math.max(0, Math.ceil(leftMs / DAY_MS));
}

export function neuroPassSeasonStateLabel(state: NeuroPassSeasonState): 'PRESEASON' | 'ACTIVE' | 'GRACE' | 'ENDED' {
  if (state === 'preseason') {
    return 'PRESEASON';
  }

  if (state === 'active') {
    return 'ACTIVE';
  }

  if (state === 'grace') {
    return 'GRACE';
  }

  return 'ENDED';
}
