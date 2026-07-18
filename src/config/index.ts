import botData from './bots.json';
import audioSettingData from './audio-settings.json';
import battleAudioData from './battle-audio.json';
import battleFeedbackData from './battle-feedback.json';
import battleMapData from './battle-maps.json';
import battleRuleData from './battle-rules.json';
import battleRewardData from './battle-rewards.json';
import battleStageRuleData from './battle-stage-rules.json';
import battleUiData from './battle-ui.json';
import bossBalanceData from './boss-balance.json';
import bossBehaviorData from './boss-behavior.json';
import bossSpecialAttackData from './boss-special-attack.json';
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
  BattleMapConfig,
  BotConfig,
  CookieConfig,
  DifficultyConfig,
  DiscConfig,
  EnemyDiscConfig,
  EnemyWaveConfig,
  MonsterConfig,
  UpgradeConfig,
} from '../types/game';
import { ConfigValidationError, validateGameConfig } from './validation';

export { ConfigValidationError, validateGameConfig };

export const CONFIG_TABLES = validateGameConfig({
  AUDIO_SETTINGS: audioSettingData,
  BATTLE_AUDIO: battleAudioData,
  BATTLE_FEEDBACK: battleFeedbackData,
  BATTLE_MAPS: battleMapData,
  BATTLE_RULES: battleRuleData,
  BATTLE_REWARDS: battleRewardData,
  BATTLE_STAGE_RULES: battleStageRuleData,
  BATTLE_UI: battleUiData,
  BOSS_BALANCE: bossBalanceData,
  BOSS_BEHAVIOR: bossBehaviorData,
  BOSS_SPECIAL_ATTACK: bossSpecialAttackData,
  BOTS: botData,
  COOKIE_UPGRADE_RULES: cookieUpgradeRuleData,
  COOKIE_UPGRADES: cookieUpgradeData,
  COOKIES: cookieData,
  DIFFICULTIES: difficultyData,
  DISC_UPGRADE_RULES: discUpgradeRuleData,
  DISCS: discData,
  ENEMY_DISCS: enemyDiscData,
  ENEMY_WAVES: enemyWaveData,
  GIANT_DISC: giantDiscData,
  MONSTERS: monsterData,
  PROGRESSION: progressionData,
  SAVE_MIGRATIONS: saveMigrationData,
});

export const {
  AUDIO_SETTINGS,
  BATTLE_AUDIO,
  BATTLE_FEEDBACK,
  BATTLE_MAPS,
  BATTLE_RULES,
  BATTLE_REWARDS,
  BATTLE_STAGE_RULES,
  BATTLE_UI,
  BOSS_BALANCE,
  BOSS_BEHAVIOR,
  BOSS_SPECIAL_ATTACK,
  BOTS,
  COOKIE_UPGRADE_RULES,
  COOKIE_UPGRADES,
  COOKIES,
  DIFFICULTIES,
  DISC_UPGRADE_RULES,
  DISCS,
  ENEMY_DISCS,
  ENEMY_WAVES,
  GIANT_DISC,
  MONSTERS,
  PROGRESSION,
  SAVE_MIGRATIONS,
} = CONFIG_TABLES;

const difficultyById = new Map(DIFFICULTIES.map((item) => [item.id, item]));
const battleMapByDifficultyId = new Map(
  BATTLE_MAPS.map((item) => [item.difficultyId, item]),
);
const monsterById = new Map(MONSTERS.map((item) => [item.id, item]));
const enemyWaveById = new Map(ENEMY_WAVES.map((item) => [item.id, item]));
const botById = new Map(BOTS.map((item) => [item.id, item]));
const upgradeById = new Map(COOKIE_UPGRADES.map((item) => [item.id, item]));
const discById = new Map(DISCS.map((item) => [item.id, item]));
const cookieById = new Map(COOKIES.map((item) => [item.id, item]));
const enemyDiscByLevel = new Map(ENEMY_DISCS.map((item) => [item.level, item]));

function requireConfig<T>(value: T | undefined, kind: string, key: string | number): T {
  if (value === undefined) {
    throw new ConfigValidationError(`${kind}.${key}`, '정의되지 않은 설정을 조회했습니다.');
  }
  return value;
}

export function getDifficulty(id: string): DifficultyConfig {
  return requireConfig(difficultyById.get(id), 'DIFFICULTIES.id', id);
}

export function getBattleMapForDifficulty(difficultyId: string): BattleMapConfig {
  return requireConfig(
    battleMapByDifficultyId.get(difficultyId),
    'BATTLE_MAPS.difficultyId',
    difficultyId,
  );
}

export function getEnemyDisc(level: number): EnemyDiscConfig {
  return requireConfig(enemyDiscByLevel.get(level), 'ENEMY_DISCS.level', level);
}

export function getUpgrade(id: string): UpgradeConfig | undefined {
  return upgradeById.get(id);
}

export function getMonster(id: string): MonsterConfig {
  return requireConfig(monsterById.get(id), 'MONSTERS.id', id);
}

export function getEnemyWave(id: string): EnemyWaveConfig {
  return requireConfig(enemyWaveById.get(id), 'ENEMY_WAVES.id', id);
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
  return requireConfig(cookieById.get(id), 'COOKIES.id', id);
}
