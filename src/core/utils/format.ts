export function formatPercent(decimal: number): string {
  const percent = Math.max(0, Math.min(1, decimal)) * 100;
  return `${Math.round(percent)}%`;
}
