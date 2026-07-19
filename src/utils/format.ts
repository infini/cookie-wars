const COMPACT_KOREAN_UNITS = [
  { value: 1_000, suffix: '천' },
  { value: 10_000, suffix: '만' },
  { value: 100_000_000, suffix: '억' },
  { value: 1_000_000_000_000, suffix: '조' },
] as const;

function trimSingleDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

export function formatNumber(value: number): string {
  const safeValue = Math.max(0, Math.floor(value));
  const unit = [...COMPACT_KOREAN_UNITS]
    .reverse()
    .find((candidate) => safeValue >= candidate.value);
  if (unit) {
    return `${trimSingleDecimal(safeValue / unit.value)}${unit.suffix}`;
  }
  return safeValue.toLocaleString('ko-KR');
}

export function formatSeconds(milliseconds: number): string {
  return `${(milliseconds / 1000).toFixed(1)}초`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
