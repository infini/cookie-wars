const COMPACT_KOREAN_UNITS = [
  { value: '1000', suffix: '천' },
  { value: '10000', suffix: '만' },
  { value: '100000000', suffix: '억' },
  { value: '1000000000000', suffix: '조' },
  { value: '10000000000000000', suffix: '경' },
  { value: '100000000000000000000', suffix: '해' },
  { value: '1000000000000000000000000', suffix: '자' },
  { value: '10000000000000000000000000000', suffix: '양' },
  { value: '100000000000000000000000000000000', suffix: '구' },
  { value: '1000000000000000000000000000000000000', suffix: '간' },
  { value: '10000000000000000000000000000000000000000', suffix: '정' },
  { value: '100000000000000000000000000000000000000000000', suffix: '재' },
  { value: '1000000000000000000000000000000000000000000000000', suffix: '극' },
  { value: '10000000000000000000000000000000000000000000000000000', suffix: '항하사' },
  { value: '100000000000000000000000000000000000000000000000000000000', suffix: '아승기' },
  { value: '1000000000000000000000000000000000000000000000000000000000000', suffix: '나유타' },
  { value: '10000000000000000000000000000000000000000000000000000000000000000', suffix: '불가사의' },
  { value: '100000000000000000000000000000000000000000000000000000000000000000000', suffix: '무량대수' },
] as const;

const BIGINT_COMPACT_KOREAN_UNITS = COMPACT_KOREAN_UNITS.map((unit) => ({
  ...unit,
  bigintValue: BigInt(unit.value),
}));

const NUMBER_COMPACT_KOREAN_UNITS = COMPACT_KOREAN_UNITS.map((unit) => ({
  ...unit,
  numberValue: Number(unit.value),
}));

function trimSingleDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

function compactBigInt(value: bigint): string {
  const safeValue = value < BigInt(0) ? BigInt(0) : value;
  const unit = [...BIGINT_COMPACT_KOREAN_UNITS]
    .reverse()
    .find((candidate) => safeValue >= candidate.bigintValue);
  if (unit) {
    const whole = safeValue / unit.bigintValue;
    const decimal = (safeValue % unit.bigintValue) * BigInt(10) / unit.bigintValue;
    return `${whole.toString()}${decimal > BigInt(0) ? `.${decimal.toString()}` : ''}${unit.suffix}`;
  }
  return safeValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatNumber(value: number | bigint): string {
  if (typeof value === 'bigint') return compactBigInt(value);
  const safeValue = Math.max(0, Math.floor(value));
  const unit = [...NUMBER_COMPACT_KOREAN_UNITS]
    .reverse()
    .find((candidate) => safeValue >= candidate.numberValue);
  if (unit) {
    return `${trimSingleDecimal(safeValue / unit.numberValue)}${unit.suffix}`;
  }
  return safeValue.toLocaleString('ko-KR');
}

export function formatSeconds(milliseconds: number): string {
  return `${(milliseconds / 1000).toFixed(1)}초`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
