import { COOKIE_FRAGMENTS, getCookieFragment, getUpgrade } from '../config';
import type {
  CookieFragmentKind,
  CookieFragmentRewardResult,
  CookieFragmentStats,
  GameState,
} from '../types/game';
import {
  clampFiniteNumber,
  clampSafeInteger,
  saturatingLinearInteger,
  saturatingProductInteger,
} from './safeNumbers';
import { calculateCookieStats } from './selectors/cookieSelectors';
import { getUpgradeProgress } from './selectors/upgradeSelectors';

export function getCookieFragmentStats(
  state: GameState,
  kind: CookieFragmentKind,
): CookieFragmentStats {
  const config = getCookieFragment(kind);
  const progress = getUpgradeProgress(state, config.upgradeId);
  const base = getUpgrade(config.upgradeId)?.levels[0];
  return calculateCookieFragmentStatsForLevel(
    kind,
    progress?.current.level ?? base?.level ?? 1,
    progress?.current.value ?? base?.value ?? 0,
  );
}

export function calculateCookieFragmentStatsForLevel(
  kind: CookieFragmentKind,
  level: number,
  chanceUnits: number,
): CookieFragmentStats {
  const config = getCookieFragment(kind);
  const baseLevel = getUpgrade(config.upgradeId)?.levels[0]?.level ?? 1;
  const extraLevels = Math.max(0, clampSafeInteger(level) - baseLevel);
  return {
    config,
    chanceUnits: Math.min(
      config.maximumChanceUnits,
      clampSafeInteger(chanceUnits),
    ),
    rewardMultiplier: saturatingLinearInteger(
      config.baseRewardMultiplier,
      config.rewardMultiplierIncreasePerLevel,
      extraLevels,
    ),
  };
}

export function rollCookieFragment(
  state: GameState,
  randomUnit: number,
): CookieFragmentKind | undefined {
  const boundedRandom = clampFiniteNumber(randomUnit, {
    fallback: 1 - Number.EPSILON,
    maximum: 1 - Number.EPSILON,
  });
  const roll = Math.floor(boundedRandom * COOKIE_FRAGMENTS.probabilityScale);
  let threshold = 0;
  for (const fragment of COOKIE_FRAGMENTS.types) {
    threshold += getCookieFragmentStats(state, fragment.id).chanceUnits;
    if (roll < threshold) return fragment.id;
  }
  return undefined;
}

export function calculateCookieFragmentReward(
  state: GameState,
  kind: CookieFragmentKind,
): CookieFragmentRewardResult {
  const stats = getCookieFragmentStats(state, kind);
  return {
    kind,
    multiplier: stats.rewardMultiplier,
    amount: saturatingProductInteger(
      calculateCookieStats(state).clickPower,
      stats.rewardMultiplier,
    ),
  };
}

export function getCookieFragmentChancePercent(chanceUnits: number): number {
  return chanceUnits / COOKIE_FRAGMENTS.probabilityScale * 100;
}

export function formatCookieFragmentChancePercent(
  chanceUnits: number,
  kind: CookieFragmentKind,
): string {
  return getCookieFragmentChancePercent(chanceUnits).toLocaleString('ko-KR', {
    maximumFractionDigits: getCookieFragment(kind).displayMaximumFractionDigits,
  });
}
