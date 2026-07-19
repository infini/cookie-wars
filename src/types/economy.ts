export interface UpgradeLevelConfig {
  level: number;
  value: number;
  cost: number;
}

export interface UpgradeConfig {
  id: string;
  name: string;
  description: string;
  unit: string;
  countsTowardCookieEvolution: boolean;
  enabled?: boolean;
  visible?: boolean;
  maximumLevel?: number;
  renderBaseSizePixels?: number;
  renderMaximumSizePixels?: number;
  levels: UpgradeLevelConfig[];
}

export interface InfiniteUpgradeRuleConfig {
  valueIncreasePerLevel: number;
  costGrowthMultiplier: number;
}

export type CookieUpgradeRulesConfig = Record<string, InfiniteUpgradeRuleConfig>;

export interface CookieCriticalConfig {
  upgradeId: string;
  probabilityScale: number;
  maximumChanceUnits: number;
  baseRewardMultiplier: number;
  rewardMultiplierIncreasePerLevel: number;
  feedbackPowerRank: number;
  displayMaximumFractionDigits: number;
}

export type CookieSuperCriticalConfig = CookieCriticalConfig;

export interface DiscLevelConfig {
  level: number;
  damage: number;
  size: number;
  speed: number;
  cooldownMs: number;
  cost: number;
}

export interface DiscConfig {
  id: string;
  name: string;
  purchaseCost: number;
  description: string;
  upgradeProfileId?: string;
  levels: DiscLevelConfig[];
}

export type DiscDamageGrowthMode = 'multiplier' | 'linear';

export interface DiscUpgradeProfileConfig {
  id: string;
  damageGrowthMode: DiscDamageGrowthMode;
  damageGrowthMultiplier: number;
  damageIncreasePerLevel: number;
  sizeIncreasePerLevel: number;
  speedIncreasePerLevel: number;
  cooldownReductionMsPerLevel: number;
  minimumCooldownMs: number;
  costGrowthMultiplier: number;
}

export interface DiscUpgradeRulesConfig {
  defaultProfileId: string;
  profiles: DiscUpgradeProfileConfig[];
}

export interface BotConfig {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  baseCost: number;
  costMultiplier: number;
  discDamageMultiplier: number;
  attackIntervalMs: number;
}

export interface CookieConfig {
  id: string;
  imageKey: string;
  name: string;
  description: string;
  requiredTotalUpgradeLevels: number;
  clickMultiplier: number;
  autoProductionMultiplier: number;
  healthMultiplier: number;
}

export interface CookieExpansionConfig {
  legacyCookieCount: number;
  extensionCookieCount: number;
  firstRequiredTotalUpgradeLevels: number;
  requiredLevelStep: number;
  multiplierPerCookie: number;
}
