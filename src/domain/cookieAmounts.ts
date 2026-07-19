import type { CookieAmount } from '../types/gameState';

export const ZERO_COOKIE_AMOUNT: CookieAmount = BigInt(0);

function normalizeNumber(value: number): CookieAmount | undefined {
  if (!Number.isFinite(value) || value < 0) return undefined;
  return BigInt(Math.floor(value));
}

export function normalizeCookieAmount(
  value: unknown,
  fallback: CookieAmount = ZERO_COOKIE_AMOUNT,
): CookieAmount {
  if (typeof value === 'bigint') return value >= ZERO_COOKIE_AMOUNT ? value : fallback;
  if (typeof value === 'number') return normalizeNumber(value) ?? fallback;
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)$/.test(value)) return fallback;
  try {
    return BigInt(value);
  } catch {
    return fallback;
  }
}

export function addCookieAmounts(
  current: unknown,
  increment: unknown,
): CookieAmount {
  return normalizeCookieAmount(current) + normalizeCookieAmount(increment);
}

export function subtractCookieAmounts(
  current: unknown,
  decrement: unknown,
): CookieAmount {
  const left = normalizeCookieAmount(current);
  const right = normalizeCookieAmount(decrement);
  return right >= left ? ZERO_COOKIE_AMOUNT : left - right;
}

export function canAffordCookieAmount(
  cookies: unknown,
  cost: unknown,
): boolean {
  return normalizeCookieAmount(cookies) >= normalizeCookieAmount(cost);
}

export function maxCookieAmount(
  first: unknown,
  second: unknown,
): CookieAmount {
  const left = normalizeCookieAmount(first);
  const right = normalizeCookieAmount(second);
  return left >= right ? left : right;
}

export function serializeCookieAmount(value: unknown): string {
  return normalizeCookieAmount(value).toString(10);
}
