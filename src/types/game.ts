export type TabId =
  | 'game'
  | 'battle'
  | 'cookie'
  | 'upgrade'
  | 'monster'
  | 'difficulty'
  | 'disc'
  | 'bot';

export type SoundVolumeLevel = 1 | 2 | 3 | 4 | 5;

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

export interface InfiniteUpgradeRuleConfig {
  valueIncreasePerLevel: number;
  costGrowthMultiplier: number;
}

export type CookieUpgradeRulesConfig = Record<string, InfiniteUpgradeRuleConfig>;

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
  monsterId: string;
  enemyCount: number;
  hpMultiplier: number;
  attackMultiplier: number;
  moveSpeed: number;
  enemyDiscLevel: number;
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

export interface ProgressionConfig {
  winsToUnlockNextDifficulty: number;
  saveDebounceMs: number;
  autoProductionIntervalMs: number;
}

export interface AudioLevelConfig {
  level: SoundVolumeLevel;
  volume: number;
}

export interface AudioSettingsConfig {
  defaultLevel: SoundVolumeLevel;
  previewDelayMs: number;
  levels: AudioLevelConfig[];
}

export interface SaveMigrationsConfig {
  botIdAliases: Record<string, string>;
}

export interface BattleRulesConfig {
  tickMs: number;
  maxDeltaMs: number;
  enemyColumns: number;
  enemyStartX: number;
  enemyColumnGap: number;
  enemyStartY: number;
  initialEnemySpawnCount: number;
  enemySpawnIntervalMs: number;
  enemyStopY: number;
  enemyMinX: number;
  enemyMaxX: number;
  enemyMoveDivisor: number;
  enemyFirstShotDelayMs: number;
  enemyShotStaggerMs: number;
  enemyProjectileStartOffsetY: number;
  enemyProjectileMoveDivisor: number;
  enemyMeleeTriggerY: number;
  enemyMeleeIntervalMs: number;
  coreProjectileHitY: number;
  playerStartX: number;
  playerStartY: number;
  playerHomingMs: number;
  playerProjectileMoveDivisor: number;
  playerHitToleranceY: number;
  playerHitToleranceX: number;
  playerProjectileEndY: number;
  castleDiscDamageMultiplier: number;
  maxRenderedPlayerDiscSize: number;
  resultNoticeMs: number;
}

export interface BattleStageRulesConfig {
  hpMultiplierPerWin: number;
  attackMultiplierPerWin: number;
  moveSpeedMultiplierPerWin: number;
  extraEnemyEveryWins: number;
  maximumExtraEnemies: number;
  enemyDiscLevelEveryWins: number;
}

export interface GameState {
  saveVersion: number;
  cookies: number;
  lifetimeCookies: number;
  upgradeLevels: Record<string, number>;
  ownedDiscIds: string[];
  discLevels: Record<string, number>;
  selectedDiscId: string;
  botCounts: Record<string, number>;
  selectedDifficultyId: string;
  highestUnlockedDifficultyIndex: number;
  difficultyWinCounts: Record<string, number>;
  clearedDifficultyIds: string[];
  rewardClaimedDifficultyIds: string[];
  discoveredMonsterIds: string[];
  newMonsterIds: string[];
  soundEnabled: boolean;
  soundVolumeLevel: SoundVolumeLevel;
  vibrationEnabled: boolean;
  lastSavedAt: number;
}

export interface CookieStats {
  clickPower: number;
  sizePercent: number;
  autoProduction: number;
  maxHealth: number;
  cookieLevel: number;
  activeCookieId: string;
  totalUpgradeLevels: number;
}

export interface BattleRewardResult {
  firstClear: boolean;
  reward: number;
  difficultyWins: number;
  winsRequired: number;
  unlockedNextDifficulty: boolean;
}
