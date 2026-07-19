import {
  AudioSettingsConfig,
  BattleAutoConfig,
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
  CookieExpansionConfig,
  CookieCriticalConfig,
  CookieFeedbackConfig,
  CookieFragmentsConfig,
  CookieInputConfig,
  ClickerRobotsConfig,
  CookiePityConfig,
  CookieSuperCriticalConfig,
  CookieSpecialEffectsConfig,
  CookieUpgradeRulesConfig,
  DifficultyExpansionConfig,
  DifficultyConfig,
  DiscConfig,
  DiscUpgradeRulesConfig,
  EnemyDiscConfig,
  EnemyWaveConfig,
  GiantDiscConfig,
  MonsterConfig,
  MiniGameConfig,
  ProgressionConfig,
  SaveMigrationsConfig,
  UpgradeConfig,
} from '../../types/game';

export interface GameConfigInput {
  AUDIO_SETTINGS: unknown;
  BATTLE_AUDIO: unknown;
  BATTLE_AUTO: unknown;
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
  COOKIE_EXPANSION: unknown;
  COOKIE_FEEDBACK: unknown;
  COOKIE_FRAGMENTS: unknown;
  COOKIE_INPUT: unknown;
  CLICKER_ROBOTS: unknown;
  COOKIE_PITY: unknown;
  COOKIE_SUPER_CRITICAL: unknown;
  COOKIE_SPECIAL_EFFECTS: unknown;
  COOKIES: unknown;
  DIFFICULTIES: unknown;
  DIFFICULTY_EXPANSION: unknown;
  DISC_UPGRADE_RULES: unknown;
  DISCS: unknown;
  ENEMY_DISCS: unknown;
  ENEMY_WAVES: unknown;
  GIANT_DISC: unknown;
  MONSTERS: unknown;
  MINI_GAME: unknown;
  PROGRESSION: unknown;
  SAVE_MIGRATIONS: unknown;
}

export interface ValidatedGameConfig {
  AUDIO_SETTINGS: AudioSettingsConfig;
  BATTLE_AUDIO: BattleAudioConfig;
  BATTLE_AUTO: BattleAutoConfig;
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
  COOKIE_EXPANSION: CookieExpansionConfig;
  COOKIE_FEEDBACK: CookieFeedbackConfig;
  COOKIE_FRAGMENTS: CookieFragmentsConfig;
  COOKIE_INPUT: CookieInputConfig;
  CLICKER_ROBOTS: ClickerRobotsConfig;
  COOKIE_PITY: CookiePityConfig;
  COOKIE_SUPER_CRITICAL: CookieSuperCriticalConfig;
  COOKIE_SPECIAL_EFFECTS: CookieSpecialEffectsConfig;
  COOKIES: CookieConfig[];
  DIFFICULTIES: DifficultyConfig[];
  DIFFICULTY_EXPANSION: DifficultyExpansionConfig;
  DISC_UPGRADE_RULES: DiscUpgradeRulesConfig;
  DISCS: DiscConfig[];
  ENEMY_DISCS: EnemyDiscConfig[];
  ENEMY_WAVES: EnemyWaveConfig[];
  GIANT_DISC: GiantDiscConfig;
  MONSTERS: MonsterConfig[];
  MINI_GAME: MiniGameConfig;
  PROGRESSION: ProgressionConfig;
  SAVE_MIGRATIONS: SaveMigrationsConfig;
}
