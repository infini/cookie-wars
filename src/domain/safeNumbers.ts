export const MAX_GAME_INTEGER = Number.MAX_SAFE_INTEGER;

export interface SafeIntegerOptions {
  fallback?: number;
  minimum?: number;
  maximum?: number;
  rounding?: 'floor' | 'round' | 'ceil';
}

export interface FiniteNumberOptions {
  fallback?: number;
  minimum?: number;
  maximum?: number;
}

function finiteBound(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function clampFiniteNumber(
  value: unknown,
  options: FiniteNumberOptions = {},
): number {
  const minimum = finiteBound(options.minimum, 0);
  const maximum = Math.max(minimum, finiteBound(options.maximum, MAX_GAME_INTEGER));
  const fallback = Math.min(
    maximum,
    Math.max(minimum, finiteBound(options.fallback, minimum)),
  );
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

export function clampSafeInteger(
  value: unknown,
  options: SafeIntegerOptions = {},
): number {
  const minimum = Math.ceil(clampFiniteNumber(options.minimum ?? 0, {
    fallback: 0,
    minimum: -MAX_GAME_INTEGER,
    maximum: MAX_GAME_INTEGER,
  }));
  const maximum = Math.floor(clampFiniteNumber(options.maximum ?? MAX_GAME_INTEGER, {
    fallback: MAX_GAME_INTEGER,
    minimum,
    maximum: MAX_GAME_INTEGER,
  }));
  const fallback = clampFiniteNumber(options.fallback ?? minimum, {
    fallback: minimum,
    minimum,
    maximum,
  });
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return Math.floor(fallback);
  }
  const rounded = options.rounding === 'round'
    ? Math.round(value)
    : options.rounding === 'ceil'
      ? Math.ceil(value)
      : Math.floor(value);
  return Math.min(maximum, Math.max(minimum, rounded));
}

export function saturatingAdd(
  current: unknown,
  increment: unknown,
  maximum: number = MAX_GAME_INTEGER,
): number {
  const safeMaximum = clampSafeInteger(maximum, { fallback: MAX_GAME_INTEGER, minimum: 0 });
  const left = clampSafeInteger(current, { fallback: 0, maximum: safeMaximum });
  if (typeof increment !== 'number' || !Number.isFinite(increment) || increment <= 0) {
    return left;
  }
  const right = clampSafeInteger(increment, { fallback: 0, maximum: safeMaximum });
  return right >= safeMaximum - left ? safeMaximum : left + right;
}

export function saturatingSubtract(current: unknown, decrement: unknown): number {
  const left = clampSafeInteger(current);
  if (typeof decrement !== 'number' || !Number.isFinite(decrement) || decrement <= 0) {
    return left;
  }
  const right = clampSafeInteger(decrement);
  return right >= left ? 0 : left - right;
}

export function saturatingLinearInteger(
  base: unknown,
  increment: unknown,
  steps: unknown,
  rounding: SafeIntegerOptions['rounding'] = 'round',
): number {
  const safeBase = clampFiniteNumber(base, { fallback: 0 });
  const safeIncrement = clampFiniteNumber(increment, { fallback: 0 });
  const safeSteps = clampSafeInteger(steps);
  const result = safeBase + safeIncrement * safeSteps;
  if (!Number.isFinite(result) || result >= MAX_GAME_INTEGER) return MAX_GAME_INTEGER;
  return clampSafeInteger(result, { rounding });
}

export function saturatingProductInteger(
  first: unknown,
  second: unknown,
  rounding: SafeIntegerOptions['rounding'] = 'round',
): number {
  const left = clampFiniteNumber(first, { fallback: 0 });
  const right = clampFiniteNumber(second, { fallback: 0 });
  const result = left * right;
  if (!Number.isFinite(result) || result >= MAX_GAME_INTEGER) return MAX_GAME_INTEGER;
  return clampSafeInteger(result, { rounding });
}

export function saturatingExponentialInteger(
  base: unknown,
  multiplier: unknown,
  exponent: unknown,
  rounding: SafeIntegerOptions['rounding'] = 'round',
): number {
  const safeBase = clampFiniteNumber(base, { fallback: 0 });
  const safeMultiplier = clampFiniteNumber(multiplier, { fallback: 0 });
  const safeExponent = clampSafeInteger(exponent);
  const result = safeBase * safeMultiplier ** safeExponent;
  if (!Number.isFinite(result) || result >= MAX_GAME_INTEGER) return MAX_GAME_INTEGER;
  return clampSafeInteger(result, { rounding });
}

export function nextSafeInteger(value: unknown, minimum: number = 0): number | undefined {
  const current = clampSafeInteger(value, { fallback: minimum, minimum });
  return current < MAX_GAME_INTEGER ? current + 1 : undefined;
}
