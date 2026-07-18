import { COOKIE_CRITICAL } from '../config';
import type { CookieClickResult, GameState } from '../types/game';
import {
  clampFiniteNumber,
  saturatingProductInteger,
} from './safeNumbers';
import { calculateCookieStats } from './selectors/cookieSelectors';

export function calculateCookieClickReward(
  state: GameState,
  randomUnit: number,
): CookieClickResult {
  const stats = calculateCookieStats(state);
  const boundedRandom = clampFiniteNumber(randomUnit, {
    fallback: 1 - Number.EPSILON,
    maximum: 1 - Number.EPSILON,
  });
  const roll = Math.floor(boundedRandom * COOKIE_CRITICAL.probabilityScale);
  const critical = roll < stats.criticalChanceUnits;
  return {
    amount: critical
      ? saturatingProductInteger(stats.clickPower, stats.criticalRewardMultiplier)
      : stats.clickPower,
    critical,
  };
}
