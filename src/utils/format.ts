export function formatNumber(value: number): string {
  const safeValue = Math.max(0, Math.floor(value));
  if (safeValue >= 100_000_000) {
    const amount = safeValue / 100_000_000;
    return `${Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(1)}억`;
  }
  if (safeValue >= 10_000) {
    const amount = safeValue / 10_000;
    return `${Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(1)}만`;
  }
  return safeValue.toLocaleString('ko-KR');
}

export function formatSeconds(milliseconds: number): string {
  return `${(milliseconds / 1000).toFixed(1)}초`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
