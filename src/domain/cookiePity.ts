import { COOKIE_PITY } from '../config';
import type {
  CookieClickKind,
  CookieFragmentKind,
  CookiePityKind,
  CookiePityChanceUnits,
  CookiePityMisses,
} from '../types/game';
import { clampSafeInteger, saturatingAdd } from './safeNumbers';

export const INITIAL_COOKIE_PITY_MISSES: CookiePityMisses = {
  critical: 0,
  superCritical: 0,
  magma: 0,
  electric: 0,
};

export function normalizeCookiePityMisses(value: unknown): CookiePityMisses {
  const source = typeof value === 'object' && value !== null
    ? value as Partial<Record<CookiePityKind, unknown>>
    : {};
  return Object.fromEntries(
    Object.keys(INITIAL_COOKIE_PITY_MISSES).map((kind) => [
      kind,
      clampSafeInteger(source[kind as CookiePityKind]),
    ]),
  ) as CookiePityMisses;
}

export function getCookiePityAttemptLimit(
  chanceUnits: number,
  probabilityScale: number,
): number {
  const chance = clampSafeInteger(chanceUnits);
  const scale = clampSafeInteger(probabilityScale, { minimum: 1, fallback: 1 });
  if (chance <= 0) return Number.MAX_SAFE_INTEGER;
  return Math.max(1, Math.ceil(scale / Math.min(chance, scale)));
}

export function isCookiePityGuaranteed(
  misses: number,
  chanceUnits: number,
  probabilityScale: number,
): boolean {
  if (!COOKIE_PITY.enabled || chanceUnits <= 0) return false;
  return clampSafeInteger(misses)
    >= getCookiePityAttemptLimit(chanceUnits, probabilityScale) - 1;
}

export function getGuaranteedCookiePityKind<TKind extends CookiePityKind>(
  priority: TKind[],
  misses: CookiePityMisses,
  chances: CookiePityChanceUnits,
  probabilityScale: number,
): TKind | undefined {
  return priority.find((kind) => isCookiePityGuaranteed(
    misses[kind],
    chances[kind],
    probabilityScale,
  ));
}

function nextMisses(current: number, triggered: boolean, chanceUnits: number): number {
  if (triggered || chanceUnits <= 0) return 0;
  return saturatingAdd(clampSafeInteger(current), 1);
}

export function advanceCookiePityMisses(
  current: CookiePityMisses,
  chances: CookiePityChanceUnits,
  clickKind: CookieClickKind,
  fragmentKind?: CookieFragmentKind,
): CookiePityMisses {
  if (!COOKIE_PITY.enabled) return INITIAL_COOKIE_PITY_MISSES;
  return {
    critical: nextMisses(current.critical, clickKind !== 'normal', chances.critical),
    superCritical: nextMisses(
      current.superCritical,
      clickKind === 'superCritical',
      chances.superCritical,
    ),
    magma: nextMisses(current.magma, fragmentKind === 'magma', chances.magma),
    electric: nextMisses(current.electric, fragmentKind === 'electric', chances.electric),
  };
}
