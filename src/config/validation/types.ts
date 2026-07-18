import {
  AudioSettingsConfig,
  BattleAudioConfig,
  BattleFeedbackConfig,
  BattleMapConfig,
  BattleRulesConfig,
  BattleRewardsConfig,
  BattleStageRulesConfig,
  BattleUiConfig,
  BossAnimationConfig,
  BossBalanceConfig,
  BossBehaviorConfig,
  BossSpecialAttackConfig,
  BotAnimationConfig,
  BotConfig,
  CookieConfig,
  CookieCriticalConfig,
  CookieFeedbackConfig,
  CookieUpgradeRulesConfig,
  DifficultyConfig,
  DiscConfig,
  DiscUpgradeRulesConfig,
  EnemyDiscConfig,
  EnemyWaveConfig,
  GiantDiscConfig,
  MonsterConfig,
  ProgressionConfig,
  SaveMigrationsConfig,
  UpgradeConfig,
} from '../../types/game';

export interface GameConfigInput {
  AUDIO_SETTINGS: unknown;
  BATTLE_AUDIO: unknown;
  BATTLE_FEEDBACK: unknown;
  BATTLE_MAPS: unknown;
  BATTLE_RULES: unknown;
  BATTLE_REWARDS: unknown;
  BATTLE_STAGE_RULES: unknown;
  BATTLE_UI: unknown;
  BOSS_ANIMATION: unknown;
  BOSS_BALANCE: unknown;
  BOSS_BEHAVIOR: unknown;
  BOSS_SPECIAL_ATTACK: unknown;
  BOT_ANIMATION: unknown;
  BOTS: unknown;
  COOKIE_UPGRADE_RULES: unknown;
  COOKIE_UPGRADES: unknown;
  COOKIE_CRITICAL: unknown;
  COOKIE_FEEDBACK: unknown;
  COOKIES: unknown;
  DIFFICULTIES: unknown;
  DISC_UPGRADE_RULES: unknown;
  DISCS: unknown;
  ENEMY_DISCS: unknown;
  ENEMY_WAVES: unknown;
  GIANT_DISC: unknown;
  MONSTERS: unknown;
  PROGRESSION: unknown;
  SAVE_MIGRATIONS: unknown;
}

export interface ValidatedGameConfig {
  AUDIO_SETTINGS: AudioSettingsConfig;
  BATTLE_AUDIO: BattleAudioConfig;
  BATTLE_FEEDBACK: BattleFeedbackConfig;
  BATTLE_MAPS: BattleMapConfig[];
  BATTLE_RULES: BattleRulesConfig;
  BATTLE_REWARDS: BattleRewardsConfig;
  BATTLE_STAGE_RULES: BattleStageRulesConfig;
  BATTLE_UI: BattleUiConfig;
  BOSS_ANIMATION: BossAnimationConfig;
  BOSS_BALANCE: BossBalanceConfig;
  BOSS_BEHAVIOR: BossBehaviorConfig;
  BOSS_SPECIAL_ATTACK: BossSpecialAttackConfig;
  BOT_ANIMATION: BotAnimationConfig;
  BOTS: BotConfig[];
  COOKIE_UPGRADE_RULES: CookieUpgradeRulesConfig;
  COOKIE_UPGRADES: UpgradeConfig[];
  COOKIE_CRITICAL: CookieCriticalConfig;
  COOKIE_FEEDBACK: CookieFeedbackConfig;
  COOKIES: CookieConfig[];
  DIFFICULTIES: DifficultyConfig[];
  DISC_UPGRADE_RULES: DiscUpgradeRulesConfig;
  DISCS: DiscConfig[];
  ENEMY_DISCS: EnemyDiscConfig[];
  ENEMY_WAVES: EnemyWaveConfig[];
  GIANT_DISC: GiantDiscConfig;
  MONSTERS: MonsterConfig[];
  PROGRESSION: ProgressionConfig;
  SAVE_MIGRATIONS: SaveMigrationsConfig;
}
