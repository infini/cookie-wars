import {
  clampFiniteNumber,
  clampSafeInteger,
  MAX_GAME_INTEGER,
} from '../domain/safeNumbers';

type CombatRounding = 'floor' | 'round' | 'ceil';

/**
 * Multiplies validated combat values without changing normal floating-point
 * formula order, then caps only an unsafe result at the game-wide maximum.
 */
export function saturatingCombatProduct(values: readonly unknown[]): number {
  const result = values.reduce<number>((product, value) => (
    product * clampFiniteNumber(value, { fallback: 0 })
  ), 1);
  return clampFiniteNumber(result, {
    fallback: MAX_GAME_INTEGER,
    maximum: MAX_GAME_INTEGER,
  });
}

export function saturatingCombatProductInteger(
  values: readonly unknown[],
  rounding: CombatRounding = 'round',
  minimum = 0,
): number {
  return clampSafeInteger(saturatingCombatProduct(values), {
    fallback: MAX_GAME_INTEGER,
    minimum,
    maximum: MAX_GAME_INTEGER,
    rounding,
  });
}

/** Preserves fractional DPS while preventing an unsafe accumulated total. */
export function saturatingCombatSum(values: readonly unknown[]): number {
  return values.reduce<number>((total, value) => {
    const increment = clampFiniteNumber(value, { fallback: 0 });
    return increment >= MAX_GAME_INTEGER - total
      ? MAX_GAME_INTEGER
      : total + increment;
  }, 0);
}

export function saturatingCombatQuotient(
  numerator: unknown,
  denominator: unknown,
): number {
  const safeNumerator = clampFiniteNumber(numerator, { fallback: 0 });
  const safeDenominator = clampFiniteNumber(denominator, {
    fallback: 1,
    minimum: Number.EPSILON,
  });
  return clampFiniteNumber(safeNumerator / safeDenominator, {
    fallback: MAX_GAME_INTEGER,
    maximum: MAX_GAME_INTEGER,
  });
}
