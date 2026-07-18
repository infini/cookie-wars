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
  displayMaximumFractionDigits: number;
  effectDurationMs: number;
  effectSizePixels: number;
  flashMaximumOpacity: number;
  coreStartScale: number;
  coreEndScale: number;
  coreSizeRatio: number;
  coreBorderWidth: number;
  ringStartScale: number;
  ringEndScale: number;
  ringBorderWidth: number;
  particleCount: number;
  particleStartDistancePixels: number;
  particleEndDistancePixels: number;
  particleWidthPixels: number;
  particleHeightPixels: number;
  flashColor: string;
  coreColor: string;
  coreHighlightColor: string;
  ringColor: string;
  particleColor: string;
  particleHighlightColor: string;
}

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
  levels: DiscLevelConfig[];
}

export interface DiscUpgradeRulesConfig {
  damageGrowthMultiplier: number;
  sizeIncreasePerLevel: number;
  speedIncreasePerLevel: number;
  cooldownReductionMsPerLevel: number;
  minimumCooldownMs: number;
  costGrowthMultiplier: number;
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
