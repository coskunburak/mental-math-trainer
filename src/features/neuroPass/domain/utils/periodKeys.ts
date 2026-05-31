const DAY_MS = 24 * 60 * 60 * 1000;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function utcDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return `${year}${pad2(month)}${pad2(day)}`;
}

export function getDailyKeyUtc(nowUtc: Date): string {
  return utcDateKey(nowUtc);
}

export function getUtcWeekStart(nowUtc: Date): Date {
  const year = nowUtc.getUTCFullYear();
  const month = nowUtc.getUTCMonth();
  const day = nowUtc.getUTCDate();

  const midnightUtc = Date.UTC(year, month, day, 0, 0, 0, 0);
  const current = new Date(midnightUtc);
  const dayOfWeek = current.getUTCDay();
  const diffFromMonday = (dayOfWeek + 6) % 7;

  return new Date(midnightUtc - diffFromMonday * DAY_MS);
}

export function getWeeklyKeyUtc(nowUtc: Date): string {
  return utcDateKey(getUtcWeekStart(nowUtc));
}

export function getPeriodKeysUtc(nowUtc: Date): { dailyKey: string; weeklyKey: string } {
  return {
    dailyKey: getDailyKeyUtc(nowUtc),
    weeklyKey: getWeeklyKeyUtc(nowUtc),
  };
}

export function parseUtcDateKey(key: string): Date | null {
  const normalized = key.trim();
  if (!/^\d{8}$/.test(normalized)) {
    return null;
  }

  const year = Number(normalized.slice(0, 4));
  const month = Number(normalized.slice(4, 6));
  const day = Number(normalized.slice(6, 8));

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const utc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (
    utc.getUTCFullYear() !== year
    || utc.getUTCMonth() + 1 !== month
    || utc.getUTCDate() !== day
  ) {
    return null;
  }

  return utc;
}

export function isDateKeyInWeeklyKey(dateKey: string, weeklyKey: string): boolean {
  const date = parseUtcDateKey(dateKey);
  const weekStart = parseUtcDateKey(weeklyKey);
  if (!date || !weekStart) {
    return false;
  }

  const dateMs = date.getTime();
  const weekStartMs = weekStart.getTime();
  return dateMs >= weekStartMs && dateMs < weekStartMs + 7 * DAY_MS;
}
