import {
  COOKIES,
  COOKIE_UPGRADES,
  getUpgrade,
} from '../../config';
import {
  CookieConfig,
  CookieStats,
  GameState,
} from '../../types/game';
import {
  clampFiniteNumber,
  clampSafeInteger,
  saturatingAdd,
  saturatingProductInteger,
  saturatingSubtract,
} from '../safeNumbers';
import { getUpgradeProgress, UpgradeProgress } from './upgradeSelectors';

export interface CookieEvolutionProgress {
  visibleUpgradeLevels: number;
  legacyBonusLevels: number;
  totalUpgradeLevels: number;
  active: CookieConfig;
  next?: CookieConfig;
  remainingLevels: number;
  progressRatio: number;
}

export function calculateCookieStats(state: GameState): CookieStats {
  const progress = (upgradeId: string): UpgradeProgress | undefined => (
    getUpgradeProgress(state, upgradeId)
  );
  const value = (upgradeId: string): number => {
    return progress(upgradeId)?.current.value ?? 0;
  };
  const evolution = getCookieEvolutionProgress(state);
  return {
    clickPower: saturatingProductInteger(
      value('clickPower'),
      evolution.active.clickMultiplier,
    ),
    cookieRenderSize: clampFiniteNumber(getMaximumCookieRenderSize()),
    autoProduction: saturatingProductInteger(
      value('autoProduction'),
      evolution.active.autoProductionMultiplier,
    ),
    maxHealth: saturatingProductInteger(
      value('cookieHealth'),
      evolution.active.healthMultiplier,
    ),
    cookieLevel: evolution.totalUpgradeLevels,
    activeCookieId: evolution.active.id,
    totalUpgradeLevels: evolution.totalUpgradeLevels,
  };
}

export function getCookieEvolutionProgress(state: GameState): CookieEvolutionProgress {
  const visibleUpgradeLevels = COOKIE_UPGRADES
    .filter((upgrade) => upgrade.countsTowardCookieEvolution)
    .reduce((sum, upgrade) => (
      saturatingAdd(
        sum,
        getUpgradeProgress(state, upgrade.id)?.current.level ?? upgrade.levels[0].level,
      )
    ), 0);
  const legacyBonusLevels = clampSafeInteger(state.legacyCookieEvolutionBonusLevels);
  const totalUpgradeLevels = saturatingAdd(visibleUpgradeLevels, legacyBonusLevels);
  const active = [...COOKIES]
    .reverse()
    .find((cookie) => totalUpgradeLevels >= cookie.requiredTotalUpgradeLevels)
    ?? COOKIES[0];
  const activeIndex = COOKIES.findIndex((cookie) => cookie.id === active.id);
  const next = COOKIES[activeIndex + 1];
  const requiredStepLevels = next
    ? next.requiredTotalUpgradeLevels - active.requiredTotalUpgradeLevels
    : 0;
  return {
    visibleUpgradeLevels,
    legacyBonusLevels,
    totalUpgradeLevels,
    active,
    next,
    remainingLevels: next
      ? saturatingSubtract(next.requiredTotalUpgradeLevels, totalUpgradeLevels)
      : 0,
    progressRatio: next && requiredStepLevels > 0
      ? Math.max(
        0,
        Math.min(
          1,
          (totalUpgradeLevels - active.requiredTotalUpgradeLevels) / requiredStepLevels,
        ),
      )
      : 1,
  };
}

export function getMaximumCookieRenderSize(): number {
  const config = getUpgrade('cookieSize');
  const baseValue = config?.levels[0]?.value ?? 0;
  if (
    !config
    || baseValue <= 0
    || config.renderBaseSizePixels === undefined
    || config.renderMaximumSizePixels === undefined
  ) return 0;
  const maximumValue = Math.max(...config.levels.map((level) => level.value));
  return clampFiniteNumber(
    config.renderBaseSizePixels * maximumValue / baseValue,
    { maximum: config.renderMaximumSizePixels },
  );
}
