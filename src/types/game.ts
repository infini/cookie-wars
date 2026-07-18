export type TabId =
  | 'game'
  | 'battle'
  | 'cookie'
  | 'upgrade'
  | 'monster'
  | 'difficulty'
  | 'disc';

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
  levels: UpgradeLevelConfig[];
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

export interface EnemyDiscConfig {
  level: number;
  damage: number;
  size: number;
  speed: number;
  cooldownMs: number;
}

export interface DifficultyConfig {
  id: string;
  name: string;
  enemyCount: number;
  hpMultiplier: number;
  attackMultiplier: number;
  moveSpeed: number;
  enemyDiscLevel: number;
  dodgeChance: number;
  reactionMs: number;
  reward: number;
}

export interface MonsterConfig {
  id: string;
  name: string;
  baseHp: number;
  baseAttack: number;
  rewardCookie: number;
  description: string;
}

export interface BotConfig {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  damage: number;
  attackIntervalMs: number;
}

export interface CookieConfig {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export interface GameState {
  saveVersion: number;
  cookies: number;
  lifetimeCookies: number;
  upgradeLevels: Record<string, number>;
  discOwned: boolean;
  discLevel: number;
  botCounts: Record<string, number>;
  selectedDifficultyId: string;
  highestUnlockedDifficultyIndex: number;
  clearedDifficultyIds: string[];
  rewardClaimedDifficultyIds: string[];
  discoveredMonsterIds: string[];
  newMonsterIds: string[];
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  lastSavedAt: number;
}

export interface CookieStats {
  clickPower: number;
  sizePercent: number;
  autoProduction: number;
  maxHealth: number;
  cookieLevel: number;
}

export interface BattleRewardResult {
  firstClear: boolean;
  reward: number;
}
