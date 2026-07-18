import { COOKIE_CRITICAL, getUpgrade } from '../config';
import type { GameState } from '../types/game';
import {
  clampSafeInteger,
  saturatingLinearInteger,
} from './safeNumbers';
import { getUpgradeProgress } from './selectors/upgradeSelectors';

export interface CookieCriticalStats {
  chanceUnits: number;
  rewardMultiplier: number;
}

export function calculateCookieCriticalStatsForLevel(
  level: number,
  chanceUnits: number,
): CookieCriticalStats {
  const config = getUpgrade(COOKIE_CRITICAL.upgradeId);
  const baseLevel = config?.levels[0]?.level ?? 1;
  const extraLevels = Math.max(0, clampSafeInteger(level) - baseLevel);
  return {
    chanceUnits: Math.min(
      COOKIE_CRITICAL.maximumChanceUnits,
      clampSafeInteger(chanceUnits),
    ),
    rewardMultiplier: saturatingLinearInteger(
      COOKIE_CRITICAL.baseRewardMultiplier,
      COOKIE_CRITICAL.rewardMultiplierIncreasePerLevel,
      extraLevels,
    ),
  };
}

export function getCookieCriticalStats(state: GameState): CookieCriticalStats {
  const progress = getUpgradeProgress(state, COOKIE_CRITICAL.upgradeId);
  const base = getUpgrade(COOKIE_CRITICAL.upgradeId)?.levels[0];
  return calculateCookieCriticalStatsForLevel(
    progress?.current.level ?? base?.level ?? 1,
    progress?.current.value ?? base?.value ?? 0,
  );
}

export function getCriticalChancePercent(chanceUnits: number): number {
  return chanceUnits / COOKIE_CRITICAL.probabilityScale * 100;
}

export function formatCriticalChancePercent(chanceUnits: number): string {
  return getCriticalChancePercent(chanceUnits).toLocaleString('ko-KR', {
    maximumFractionDigits: COOKIE_CRITICAL.displayMaximumFractionDigits,
  });
}
