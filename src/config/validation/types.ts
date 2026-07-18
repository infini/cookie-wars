import {
  AudioSettingsConfig,
  BattleAudioConfig,
  BattleFeedbackConfig,
  BattleMapConfig,
  BattleRulesConfig,
  BattleStageRulesConfig,
  BattleUiConfig,
  BossBalanceConfig,
  BossBehaviorConfig,
  BossSpecialAttackConfig,
  BotConfig,
  CookieConfig,
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
  BATTLE_STAGE_RULES: unknown;
  BATTLE_UI: unknown;
  BOSS_BALANCE: unknown;
  BOSS_BEHAVIOR: unknown;
  BOSS_SPECIAL_ATTACK: unknown;
  BOTS: unknown;
  COOKIE_UPGRADE_RULES: unknown;
  COOKIE_UPGRADES: unknown;
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
  BATTLE_STAGE_RULES: BattleStageRulesConfig;
  BATTLE_UI: BattleUiConfig;
  BOSS_BALANCE: BossBalanceConfig;
  BOSS_BEHAVIOR: BossBehaviorConfig;
  BOSS_SPECIAL_ATTACK: BossSpecialAttackConfig;
  BOTS: BotConfig[];
  COOKIE_UPGRADE_RULES: CookieUpgradeRulesConfig;
  COOKIE_UPGRADES: UpgradeConfig[];
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
