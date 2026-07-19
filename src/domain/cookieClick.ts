import { COOKIE_CRITICAL, COOKIE_FRAGMENTS, COOKIE_PITY } from '../config';
import type {
  CookieClickKind,
  CookieClickResult,
  CookieFragmentKind,
  CookiePityChanceUnits,
  CookiePityMisses,
  GameState,
} from '../types/game';
import {
  clampFiniteNumber,
  saturatingProductInteger,
} from './safeNumbers';
import { calculateCookieStats } from './selectors/cookieSelectors';
import { getCookieFragmentStats, rollCookieFragment } from './cookieFragments';
import {
  advanceCookiePityMisses,
  getGuaranteedCookiePityKind,
} from './cookiePity';

export interface CookieClickTransition {
  result: CookieClickResult;
  pityMisses: CookiePityMisses;
}

export function getCookiePityChanceUnits(state: GameState): CookiePityChanceUnits {
  const stats = calculateCookieStats(state);
  return {
    critical: stats.criticalChanceUnits,
    superCritical: stats.superCriticalChanceUnits,
    magma: getCookieFragmentStats(state, 'magma').chanceUnits,
    electric: getCookieFragmentStats(state, 'electric').chanceUnits,
  };
}

function rollCriticalKind(
  state: GameState,
  randomUnit: number,
): CookieClickKind {
  const stats = calculateCookieStats(state);
  const boundedRandom = clampFiniteNumber(randomUnit, {
    fallback: 1 - Number.EPSILON,
    maximum: 1 - Number.EPSILON,
  });
  const roll = Math.floor(boundedRandom * COOKIE_CRITICAL.probabilityScale);
  if (roll < stats.superCriticalChanceUnits) return 'superCritical';
  if (roll < stats.superCriticalChanceUnits + stats.criticalChanceUnits) return 'critical';
  return 'normal';
}

function applyCriticalPity(
  naturalKind: CookieClickKind,
  pityMisses: CookiePityMisses,
  chances: CookiePityChanceUnits,
): CookieClickKind {
  const guaranteed = getGuaranteedCookiePityKind(
    COOKIE_PITY.criticalPriority,
    pityMisses,
    chances,
    COOKIE_CRITICAL.probabilityScale,
  );
  if (guaranteed === 'superCritical') return guaranteed;
  if (naturalKind === 'superCritical') return naturalKind;
  return guaranteed ?? naturalKind;
}

function applyFragmentPity(
  naturalKind: CookieFragmentKind | undefined,
  pityMisses: CookiePityMisses,
  chances: CookiePityChanceUnits,
): CookieFragmentKind | undefined {
  return getGuaranteedCookiePityKind(
    COOKIE_PITY.fragmentPriority,
    pityMisses,
    chances,
    COOKIE_FRAGMENTS.probabilityScale,
  ) ?? naturalKind;
}

export function calculateCookieClickReward(
  state: GameState,
  randomUnit: number,
  fragmentRandomUnit: number = 1 - Number.EPSILON,
): CookieClickResult {
  return calculateCookieClickTransition(
    state,
    randomUnit,
    fragmentRandomUnit,
  ).result;
}

export function calculateCookieClickTransition(
  state: GameState,
  randomUnit: number,
  fragmentRandomUnit: number = 1 - Number.EPSILON,
): CookieClickTransition {
  const stats = calculateCookieStats(state);
  const chances = getCookiePityChanceUnits(state);
  const kind = applyCriticalPity(
    rollCriticalKind(state, randomUnit),
    state.cookiePityMisses,
    chances,
  );
  const spawnedFragmentKind = applyFragmentPity(
    rollCookieFragment(state, fragmentRandomUnit),
    state.cookiePityMisses,
    chances,
  );
  const result: CookieClickResult = {
    amount: kind === 'superCritical'
      ? saturatingProductInteger(stats.clickPower, stats.superCriticalRewardMultiplier)
      : kind === 'critical'
        ? saturatingProductInteger(stats.clickPower, stats.criticalRewardMultiplier)
        : stats.clickPower,
    kind,
    ...(spawnedFragmentKind ? { spawnedFragmentKind } : {}),
  };
  return {
    result,
    pityMisses: advanceCookiePityMisses(
      state.cookiePityMisses,
      chances,
      kind,
      spawnedFragmentKind,
    ),
  };
}
