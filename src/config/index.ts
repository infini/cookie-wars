import botData from './bots.json';
import audioSettingData from './audio-settings.json';
import battleAudioData from './battle-audio.json';
import battleFeedbackData from './battle-feedback.json';
import battleMapData from './battle-maps.json';
import battleMapRuleData from './battle-map-rules.json';
import battleRuleData from './battle-rules.json';
import battleStageRuleData from './battle-stage-rules.json';
import battleUiData from './battle-ui.json';
import bossBalanceData from './boss-balance.json';
import bossBehaviorData from './boss-behavior.json';
import cookieUpgradeData from './cookie-upgrades.json';
import cookieUpgradeRuleData from './cookie-upgrade-rules.json';
import cookieData from './cookies.json';
import difficultyData from './difficulties.json';
import discData from './discs.json';
import discUpgradeRuleData from './disc-upgrade-rules.json';
import enemyDiscData from './enemy-discs.json';
import enemyWaveData from './enemy-waves.json';
import giantDiscData from './giant-disc.json';
import monsterData from './monsters.json';
import progressionData from './progression.json';
import saveMigrationData from './save-migrations.json';
import {
  BotConfig,
  AudioSettingsConfig,
  BattleAudioConfig,
  BattleFeedbackConfig,
  BattleMapConfig,
  BattleMapRulesConfig,
  BattleRulesConfig,
  BattleStageRulesConfig,
  BattleUiConfig,
  BossBalanceConfig,
  BossBehaviorConfig,
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
} from '../types/game';

export const COOKIE_UPGRADES = cookieUpgradeData as UpgradeConfig[];
export const COOKIE_UPGRADE_RULES = cookieUpgradeRuleData as CookieUpgradeRulesConfig;
export const AUDIO_SETTINGS = audioSettingData as AudioSettingsConfig;
export const BATTLE_AUDIO = battleAudioData as BattleAudioConfig;
export const BATTLE_FEEDBACK = battleFeedbackData as BattleFeedbackConfig;
export const BATTLE_MAPS = battleMapData as BattleMapConfig[];
export const BATTLE_MAP_RULES = battleMapRuleData as BattleMapRulesConfig;
export const BATTLE_RULES = battleRuleData as BattleRulesConfig;
export const BATTLE_STAGE_RULES = battleStageRuleData as BattleStageRulesConfig;
export const BATTLE_UI = battleUiData as BattleUiConfig;
export const BOSS_BALANCE = bossBalanceData as BossBalanceConfig;
export const BOSS_BEHAVIOR = bossBehaviorData as BossBehaviorConfig;
export const DISCS = discData as DiscConfig[];
export const DISC_UPGRADE_RULES = discUpgradeRuleData as DiscUpgradeRulesConfig;
export const ENEMY_DISCS = enemyDiscData as EnemyDiscConfig[];
export const ENEMY_WAVES = enemyWaveData as EnemyWaveConfig[];
export const GIANT_DISC = giantDiscData as GiantDiscConfig;
export const DIFFICULTIES = difficultyData as DifficultyConfig[];
export const MONSTERS = monsterData as MonsterConfig[];
export const BOTS = botData as BotConfig[];
export const COOKIES = cookieData as CookieConfig[];
export const PROGRESSION = progressionData as ProgressionConfig;
export const SAVE_MIGRATIONS = saveMigrationData as SaveMigrationsConfig;

const difficultyById = new Map(DIFFICULTIES.map((item) => [item.id, item]));
const monsterById = new Map(MONSTERS.map((item) => [item.id, item]));
const enemyWaveById = new Map(ENEMY_WAVES.map((item) => [item.id, item]));
const botById = new Map(BOTS.map((item) => [item.id, item]));
const upgradeById = new Map(COOKIE_UPGRADES.map((item) => [item.id, item]));
const discById = new Map(DISCS.map((item) => [item.id, item]));
const cookieById = new Map(COOKIES.map((item) => [item.id, item]));

export function getDifficulty(id: string): DifficultyConfig {
  return difficultyById.get(id) ?? DIFFICULTIES[0];
}

export function getBattleMapForBattle(
  difficultyId: string,
  battleNumber: number,
): BattleMapConfig {
  const difficultyIndex = Math.max(
    0,
    DIFFICULTIES.findIndex((difficulty) => difficulty.id === difficultyId),
  );
  const stageThemeIndex = Math.floor(
    (Math.max(1, battleNumber) - 1) / BATTLE_MAP_RULES.stagesPerTheme,
  );
  const themeIndex = (
    stageThemeIndex + difficultyIndex * BATTLE_MAP_RULES.difficultyThemeOffset
  ) % BATTLE_MAPS.length;
  return BATTLE_MAPS[themeIndex];
}

export function getEnemyDisc(level: number): EnemyDiscConfig {
  return ENEMY_DISCS[Math.max(0, Math.min(level - 1, ENEMY_DISCS.length - 1))];
}

export function getUpgrade(id: string): UpgradeConfig | undefined {
  return upgradeById.get(id);
}

export function getMonster(id: string): MonsterConfig {
  return monsterById.get(id) ?? MONSTERS[0];
}

export function getEnemyWave(id: string): EnemyWaveConfig {
  return enemyWaveById.get(id) ?? ENEMY_WAVES[0];
}

export function getEnemyWaveMonsterIds(id: string): string[] {
  const wave = getEnemyWave(id);
  return [...new Set([...wave.monsterPatternIds, wave.bossMonsterId])];
}

export function getBot(id: string): BotConfig | undefined {
  return botById.get(id);
}

export function getDisc(id: string): DiscConfig | undefined {
  return discById.get(id);
}

export function getCookie(id: string): CookieConfig {
  return cookieById.get(id) ?? COOKIES[0];
}
