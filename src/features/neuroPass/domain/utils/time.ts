const DAY_MS = 24 * 60 * 60 * 1000;

export function utcDayKey(input: Date | string | number): string {
  const date = toDate(input);

  const year = date.getUTCFullYear().toString().padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

export function getTodayUtcRange(now: Date = new Date()): [startIso: string, endIso: string] {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + DAY_MS);
  return [start.toISOString(), end.toISOString()];
}

export function isInTodayUtc(isoUtc: string, now: Date = new Date()): boolean {
  const target = new Date(isoUtc);
  if (Number.isNaN(target.getTime())) {
    return false;
  }

  const [startIso, endIso] = getTodayUtcRange(now);
  const startMs = Date.parse(startIso);
  const endMs = Date.parse(endIso);

  const targetMs = target.getTime();
  return targetMs >= startMs && targetMs < endMs;
}

export function isInUtcRange(inputIsoUtc: string, range: [startIso: string, endIso: string]): boolean {
  const targetMs = Date.parse(inputIsoUtc);
  const startMs = Date.parse(range[0]);
  const endMs = Date.parse(range[1]);

  if (!Number.isFinite(targetMs) || !Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return false;
  }

  return targetMs >= startMs && targetMs < endMs;
}

function toDate(input: Date | string | number): Date {
  if (input instanceof Date) {
    return input;
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return new Date(0);
  }

  return date;
}
