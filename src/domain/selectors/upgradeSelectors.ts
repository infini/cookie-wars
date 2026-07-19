import {
  COOKIE_UPGRADES,
  COOKIE_UPGRADE_RULES,
  getUpgrade,
} from '../../config';
import {
  GameState,
  UpgradeConfig,
  UpgradeLevelConfig,
} from '../../types/game';
import {
  clampSafeInteger,
  nextSafeInteger,
  saturatingExponentialInteger,
  saturatingLinearInteger,
} from '../safeNumbers';

export interface UpgradeProgress {
  config: UpgradeConfig;
  current: UpgradeLevelConfig;
  next?: UpgradeLevelConfig;
  affordable: boolean;
}

export function calculateUpgradeLevel(
  config: UpgradeConfig,
  level: number,
): UpgradeLevelConfig {
  const first = config.levels[0];
  const requestedLevel = clampSafeInteger(level, {
    fallback: first.level,
    minimum: first.level,
    maximum: config.maximumLevel,
  });
  const explicit = config.levels.find((item) => item.level === requestedLevel);
  if (explicit) {
    return {
      level: clampSafeInteger(explicit.level, { fallback: first.level, minimum: first.level }),
      value: clampSafeInteger(explicit.value),
      cost: clampSafeInteger(explicit.cost),
    };
  }
  const configuredLast = config.levels[config.levels.length - 1];
  const last = {
    level: clampSafeInteger(configuredLast.level, { fallback: first.level, minimum: first.level }),
    value: clampSafeInteger(configuredLast.value),
    cost: clampSafeInteger(configuredLast.cost),
  };
  const rule = COOKIE_UPGRADE_RULES[config.id];
  if (!rule || requestedLevel <= last.level) return last;
  const extraLevels = requestedLevel - last.level;
  return {
    level: requestedLevel,
    value: saturatingLinearInteger(
      last.value,
      rule.valueIncreasePerLevel,
      extraLevels,
    ),
    cost: saturatingExponentialInteger(
      last.cost,
      rule.costGrowthMultiplier,
      extraLevels,
    ),
  };
}

export function getUpgradeProgress(
  state: GameState,
  upgradeId: string,
): UpgradeProgress | undefined {
  const config = getUpgrade(upgradeId);
  if (!config) return undefined;
  const firstLevel = config.levels[0].level;
  const savedLevel = clampSafeInteger(state.upgradeLevels[config.id], {
    fallback: firstLevel,
    minimum: firstLevel,
  });
  const current = calculateUpgradeLevel(config, savedLevel);
  const nextLevel = config.maximumLevel !== undefined && current.level >= config.maximumLevel
    ? undefined
    : nextSafeInteger(current.level, firstLevel);
  const explicitNext = nextLevel === undefined
    ? undefined
    : config.levels.find((level) => level.level === nextLevel);
  const next = config.enabled === false
    ? undefined
    : explicitNext
      ?? (COOKIE_UPGRADE_RULES[config.id]
        && nextLevel !== undefined
        ? calculateUpgradeLevel(config, nextLevel)
        : undefined);
  const cookies = clampSafeInteger(state.cookies);
  return {
    config,
    current,
    next,
    affordable: !!next && cookies >= next.cost,
  };
}

export function getSortedUpgradeProgress(state: GameState): UpgradeProgress[] {
  return COOKIE_UPGRADES
    .map((upgrade, tableIndex) => ({
      progress: upgrade.visible === false
        ? undefined
        : getUpgradeProgress(state, upgrade.id),
      tableIndex,
    }))
    .filter((item): item is { progress: UpgradeProgress; tableIndex: number } => (
      item.progress !== undefined
    ))
    .sort((left, right) => {
      const priority = (progress: UpgradeProgress): number => {
        if (progress.next && progress.affordable) return 0;
        if (progress.next) return 1;
        return 2;
      };
      return priority(left.progress) - priority(right.progress)
        || (left.progress.next?.cost ?? Number.MAX_SAFE_INTEGER)
          - (right.progress.next?.cost ?? Number.MAX_SAFE_INTEGER)
        || left.tableIndex - right.tableIndex;
    })
    .map((item) => item.progress);
}
