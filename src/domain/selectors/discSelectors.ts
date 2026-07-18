import {
  DISC_UPGRADE_RULES,
  DISCS,
  getDisc,
} from '../../config';
import {
  DiscConfig,
  DiscLevelConfig,
  GameState,
} from '../../types/game';
import {
  clampSafeInteger,
  nextSafeInteger,
  saturatingExponentialInteger,
  saturatingLinearInteger,
  saturatingProductInteger,
  saturatingSubtract,
} from '../safeNumbers';

export interface DiscProgress {
  config: DiscConfig;
  current: DiscLevelConfig;
  next?: DiscLevelConfig;
  owned: boolean;
  selected: boolean;
  purchaseCost: number;
  purchaseAffordable: boolean;
  upgradeAffordable: boolean;
}

export function getDiscProgress(state: GameState): DiscProgress;
export function getDiscProgress(state: GameState, discId: string): DiscProgress | undefined;
export function getDiscProgress(
  state: GameState,
  discId?: string,
): DiscProgress | undefined {
  const explicitlyRequested = discId !== undefined;
  const config = getDisc(discId ?? state.selectedDiscId)
    ?? (explicitlyRequested ? undefined : DISCS[0]);
  if (!config) return undefined;
  const savedLevel = Math.max(
    config.levels[0].level,
    clampSafeInteger(state.discLevels[config.id], {
      fallback: config.levels[0].level,
      minimum: config.levels[0].level,
    }),
  );
  const current = calculateDiscLevel(config, savedLevel);
  const nextLevel = nextSafeInteger(current.level, config.levels[0].level);
  const next = nextLevel === undefined ? undefined : calculateDiscLevel(config, nextLevel);
  const owned = state.ownedDiscIds.includes(config.id);
  const cookies = clampSafeInteger(state.cookies);
  const purchaseCost = clampSafeInteger(config.purchaseCost);
  return {
    config,
    current,
    next,
    owned,
    selected: state.selectedDiscId === config.id,
    purchaseCost,
    purchaseAffordable: !owned && cookies >= purchaseCost,
    upgradeAffordable: owned && !!next && cookies >= next.cost,
  };
}

export function calculateDiscLevel(
  config: DiscConfig,
  level: number,
): DiscLevelConfig {
  const first = config.levels[0];
  const requestedLevel = clampSafeInteger(level, {
    fallback: first.level,
    minimum: first.level,
  });
  const explicit = config.levels.find((item) => item.level === requestedLevel);
  if (explicit) {
    return {
      level: clampSafeInteger(explicit.level, { fallback: first.level, minimum: first.level }),
      damage: clampSafeInteger(explicit.damage),
      size: clampSafeInteger(explicit.size),
      speed: clampSafeInteger(explicit.speed),
      cooldownMs: clampSafeInteger(explicit.cooldownMs),
      cost: clampSafeInteger(explicit.cost),
    };
  }
  const configuredLast = config.levels[config.levels.length - 1];
  const last: DiscLevelConfig = {
    level: clampSafeInteger(configuredLast.level, {
      fallback: first.level,
      minimum: first.level,
    }),
    damage: clampSafeInteger(configuredLast.damage),
    size: clampSafeInteger(configuredLast.size),
    speed: clampSafeInteger(configuredLast.speed),
    cooldownMs: clampSafeInteger(configuredLast.cooldownMs),
    cost: clampSafeInteger(configuredLast.cost),
  };
  const extraLevels = Math.max(0, requestedLevel - last.level);
  const cooldownReduction = saturatingProductInteger(
    DISC_UPGRADE_RULES.cooldownReductionMsPerLevel,
    extraLevels,
    'floor',
  );
  return {
    level: requestedLevel,
    damage: saturatingExponentialInteger(
      last.damage,
      DISC_UPGRADE_RULES.damageGrowthMultiplier,
      extraLevels,
    ),
    size: saturatingLinearInteger(
      last.size,
      DISC_UPGRADE_RULES.sizeIncreasePerLevel,
      extraLevels,
    ),
    speed: saturatingLinearInteger(
      last.speed,
      DISC_UPGRADE_RULES.speedIncreasePerLevel,
      extraLevels,
    ),
    cooldownMs: Math.max(
      clampSafeInteger(DISC_UPGRADE_RULES.minimumCooldownMs),
      saturatingSubtract(last.cooldownMs, cooldownReduction),
    ),
    cost: saturatingExponentialInteger(
      last.cost,
      DISC_UPGRADE_RULES.costGrowthMultiplier,
      extraLevels,
    ),
  };
}

export function getDiscOffers(state: GameState): DiscProgress[] {
  return DISCS
    .map((disc) => getDiscProgress(state, disc.id))
    .filter((progress): progress is DiscProgress => progress !== undefined);
}
