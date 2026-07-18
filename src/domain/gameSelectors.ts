import {
  BOTS,
  BATTLE_STAGE_RULES,
  COOKIE_UPGRADES,
  COOKIE_UPGRADE_RULES,
  COOKIES,
  DIFFICULTIES,
  DISC_UPGRADE_RULES,
  DISCS,
  ENEMY_DISCS,
  PROGRESSION,
  getBot,
  getDisc,
  getUpgrade,
} from '../config';
import {
  BotConfig,
  CookieConfig,
  CookieStats,
  DiscConfig,
  DiscLevelConfig,
  DifficultyConfig,
  GameState,
  UpgradeConfig,
  UpgradeLevelConfig,
} from '../types/game';

export interface UpgradeProgress {
  config: UpgradeConfig;
  current: UpgradeLevelConfig;
  next?: UpgradeLevelConfig;
  affordable: boolean;
}

export interface DiscProgress {
  config: DiscConfig;
  current: DiscLevelConfig;
  next: DiscLevelConfig;
  owned: boolean;
  selected: boolean;
  purchaseCost: number;
  purchaseAffordable: boolean;
  upgradeAffordable: boolean;
}

export interface BotOffer {
  config: BotConfig;
  count: number;
  price: number;
  affordable: boolean;
}

export interface ActiveBot {
  config: BotConfig;
  count: number;
}

export interface DifficultyProgress {
  wins: number;
  requiredWins: number;
  remainingWins: number;
  completed: boolean;
  currentBattleNumber: number;
}

export interface CookieEvolutionProgress {
  totalUpgradeLevels: number;
  active: CookieConfig;
  next?: CookieConfig;
  remainingLevels: number;
}

export function calculateUpgradeLevel(
  config: UpgradeConfig,
  level: number,
): UpgradeLevelConfig {
  const explicit = config.levels.find((item) => item.level === level);
  if (explicit) return explicit;
  const last = config.levels[config.levels.length - 1];
  const rule = COOKIE_UPGRADE_RULES[config.id];
  if (!rule || level <= last.level) return last;
  const extraLevels = level - last.level;
  return {
    level,
    value: last.value + rule.valueIncreasePerLevel * extraLevels,
    cost: Math.round(last.cost * rule.costGrowthMultiplier ** extraLevels),
  };
}

export function getUpgradeProgress(
  state: GameState,
  upgradeId: string,
): UpgradeProgress | undefined {
  const config = getUpgrade(upgradeId);
  if (!config) return undefined;
  const firstLevel = config.levels[0].level;
  const savedLevel = Math.max(firstLevel, Math.floor(state.upgradeLevels[config.id] ?? firstLevel));
  const current = calculateUpgradeLevel(config, savedLevel);
  const explicitNext = config.levels.find((level) => level.level === current.level + 1);
  const next = explicitNext
    ?? (COOKIE_UPGRADE_RULES[config.id]
      ? calculateUpgradeLevel(config, current.level + 1)
      : undefined);
  return {
    config,
    current,
    next,
    affordable: !!next && state.cookies >= next.cost,
  };
}

export function getDiscProgress(
  state: GameState,
  discId: string = state.selectedDiscId,
): DiscProgress {
  const config = getDisc(discId) ?? DISCS[0];
  const savedLevel = Math.max(
    config.levels[0].level,
    Math.floor(state.discLevels[config.id] ?? config.levels[0].level),
  );
  const current = calculateDiscLevel(config, savedLevel);
  const next = calculateDiscLevel(config, current.level + 1);
  const owned = state.ownedDiscIds.includes(config.id);
  return {
    config,
    current,
    next,
    owned,
    selected: state.selectedDiscId === config.id,
    purchaseCost: config.purchaseCost,
    purchaseAffordable: !owned && state.cookies >= config.purchaseCost,
    upgradeAffordable: owned && state.cookies >= next.cost,
  };
}

export function calculateDiscLevel(
  config: DiscConfig,
  level: number,
): DiscLevelConfig {
  const explicit = config.levels.find((item) => item.level === level);
  if (explicit) return explicit;
  const last = config.levels[config.levels.length - 1];
  const extraLevels = Math.max(0, level - last.level);
  return {
    level: last.level + extraLevels,
    damage: Math.round(last.damage * DISC_UPGRADE_RULES.damageGrowthMultiplier ** extraLevels),
    size: last.size + DISC_UPGRADE_RULES.sizeIncreasePerLevel * extraLevels,
    speed: last.speed + DISC_UPGRADE_RULES.speedIncreasePerLevel * extraLevels,
    cooldownMs: Math.max(
      DISC_UPGRADE_RULES.minimumCooldownMs,
      last.cooldownMs - DISC_UPGRADE_RULES.cooldownReductionMsPerLevel * extraLevels,
    ),
    cost: Math.round(last.cost * DISC_UPGRADE_RULES.costGrowthMultiplier ** extraLevels),
  };
}

export function getDiscOffers(state: GameState): DiscProgress[] {
  return DISCS.map((disc) => getDiscProgress(state, disc.id));
}

export function calculateBotPrice(config: BotConfig, ownedCount: number): number {
  return Math.floor(config.baseCost * config.costMultiplier ** Math.max(0, ownedCount));
}

export function getBotOffer(state: GameState, botId: string): BotOffer | undefined {
  const config = getBot(botId);
  if (!config) return undefined;
  const count = state.botCounts[botId] ?? 0;
  const price = calculateBotPrice(config, count);
  return { config, count, price, affordable: state.cookies >= price };
}

export function getBotOffers(state: GameState): BotOffer[] {
  return BOTS.map((bot) => getBotOffer(state, bot.id)).filter(
    (offer): offer is BotOffer => offer !== undefined,
  );
}

export function getActiveBots(state: GameState): ActiveBot[] {
  return BOTS.flatMap((config) => {
    const count = state.botCounts[config.id] ?? 0;
    return count > 0 ? [{ config, count }] : [];
  });
}

export function getDifficultyProgress(
  state: GameState,
  difficultyId: string,
): DifficultyProgress {
  const validDifficulty = DIFFICULTIES.some((difficulty) => difficulty.id === difficultyId);
  const wins = validDifficulty ? state.difficultyWinCounts[difficultyId] ?? 0 : 0;
  const requiredWins = PROGRESSION.winsToUnlockNextDifficulty;
  return {
    wins,
    requiredWins,
    remainingWins: Math.max(0, requiredWins - wins),
    completed: wins >= requiredWins,
    currentBattleNumber: Math.min(wins + 1, requiredWins),
  };
}

export function getBattleDifficulty(
  difficulty: DifficultyConfig,
  completedWins: number,
): DifficultyConfig {
  const stageWins = Math.max(
    0,
    Math.min(Math.floor(completedWins), PROGRESSION.winsToUnlockNextDifficulty - 1),
  );
  const extraEnemies = Math.min(
    BATTLE_STAGE_RULES.maximumExtraEnemies,
    Math.floor(stageWins / BATTLE_STAGE_RULES.extraEnemyEveryWins),
  );
  const enemyDiscBonus = Math.floor(
    stageWins / BATTLE_STAGE_RULES.enemyDiscLevelEveryWins,
  );
  return {
    ...difficulty,
    enemyCount: difficulty.enemyCount + extraEnemies,
    hpMultiplier: difficulty.hpMultiplier
      * (1 + stageWins * BATTLE_STAGE_RULES.hpMultiplierPerWin),
    attackMultiplier: difficulty.attackMultiplier
      * (1 + stageWins * BATTLE_STAGE_RULES.attackMultiplierPerWin),
    moveSpeed: difficulty.moveSpeed
      * (1 + stageWins * BATTLE_STAGE_RULES.moveSpeedMultiplierPerWin),
    enemyDiscLevel: Math.min(
      ENEMY_DISCS.length,
      difficulty.enemyDiscLevel + enemyDiscBonus,
    ),
  };
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
    clickPower: Math.round(value('clickPower') * evolution.active.clickMultiplier),
    sizePercent: value('cookieSize'),
    autoProduction: Math.round(
      value('autoProduction') * evolution.active.autoProductionMultiplier,
    ),
    maxHealth: Math.round(value('cookieHealth') * evolution.active.healthMultiplier),
    cookieLevel: evolution.totalUpgradeLevels,
    activeCookieId: evolution.active.id,
    totalUpgradeLevels: evolution.totalUpgradeLevels,
  };
}

export function getCookieEvolutionProgress(state: GameState): CookieEvolutionProgress {
  const totalUpgradeLevels = COOKIE_UPGRADES.reduce((sum, upgrade) => (
    sum + (getUpgradeProgress(state, upgrade.id)?.current.level ?? upgrade.levels[0].level)
  ), 0);
  const active = [...COOKIES]
    .reverse()
    .find((cookie) => totalUpgradeLevels >= cookie.requiredTotalUpgradeLevels)
    ?? COOKIES[0];
  const activeIndex = COOKIES.findIndex((cookie) => cookie.id === active.id);
  const next = COOKIES[activeIndex + 1];
  return {
    totalUpgradeLevels,
    active,
    next,
    remainingLevels: next
      ? Math.max(0, next.requiredTotalUpgradeLevels - totalUpgradeLevels)
      : 0,
  };
}

export function makeInitialUpgradeLevels(): Record<string, number> {
  return Object.fromEntries(
    COOKIE_UPGRADES.map((upgrade) => [upgrade.id, upgrade.levels[0].level]),
  );
}

export function makeInitialBotCounts(): Record<string, number> {
  return Object.fromEntries(BOTS.map((bot) => [bot.id, 0]));
}

export function makeInitialDiscLevels(): Record<string, number> {
  return Object.fromEntries(DISCS.map((disc) => [disc.id, disc.levels[0].level]));
}
