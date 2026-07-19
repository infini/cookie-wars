import { COOKIE_SUPER_CRITICAL, getUpgrade } from '../config';
import type { GameState } from '../types/game';
import { clampSafeInteger, saturatingLinearInteger } from './safeNumbers';
import { getUpgradeProgress } from './selectors/upgradeSelectors';

export interface CookieSuperCriticalStats {
  chanceUnits: number;
  rewardMultiplier: number;
}

export function calculateCookieSuperCriticalStatsForLevel(
  level: number,
  chanceUnits: number,
): CookieSuperCriticalStats {
  const config = getUpgrade(COOKIE_SUPER_CRITICAL.upgradeId);
  const baseLevel = config?.levels[0]?.level ?? 1;
  const extraLevels = Math.max(0, clampSafeInteger(level) - baseLevel);
  return {
    chanceUnits: Math.min(
      COOKIE_SUPER_CRITICAL.maximumChanceUnits,
      clampSafeInteger(chanceUnits),
    ),
    rewardMultiplier: saturatingLinearInteger(
      COOKIE_SUPER_CRITICAL.baseRewardMultiplier,
      COOKIE_SUPER_CRITICAL.rewardMultiplierIncreasePerLevel,
      extraLevels,
    ),
  };
}

export function getCookieSuperCriticalStats(
  state: GameState,
): CookieSuperCriticalStats {
  const progress = getUpgradeProgress(state, COOKIE_SUPER_CRITICAL.upgradeId);
  const base = getUpgrade(COOKIE_SUPER_CRITICAL.upgradeId)?.levels[0];
  return calculateCookieSuperCriticalStatsForLevel(
    progress?.current.level ?? base?.level ?? 1,
    progress?.current.value ?? base?.value ?? 0,
  );
}

export function getSuperCriticalChancePercent(chanceUnits: number): number {
  return chanceUnits / COOKIE_SUPER_CRITICAL.probabilityScale * 100;
}

export function formatSuperCriticalChancePercent(chanceUnits: number): string {
  return getSuperCriticalChancePercent(chanceUnits).toLocaleString('ko-KR', {
    maximumFractionDigits: COOKIE_SUPER_CRITICAL.displayMaximumFractionDigits,
  });
}
