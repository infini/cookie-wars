import botData from './bots.json';
import cookieUpgradeData from './cookie-upgrades.json';
import cookieData from './cookies.json';
import difficultyData from './difficulties.json';
import discData from './discs.json';
import enemyDiscData from './enemy-discs.json';
import monsterData from './monsters.json';
import {
  BotConfig,
  CookieConfig,
  DifficultyConfig,
  DiscConfig,
  EnemyDiscConfig,
  MonsterConfig,
  UpgradeConfig,
} from '../types/game';

export const COOKIE_UPGRADES = cookieUpgradeData as UpgradeConfig[];
export const DISC = discData as DiscConfig;
export const ENEMY_DISCS = enemyDiscData as EnemyDiscConfig[];
export const DIFFICULTIES = difficultyData as DifficultyConfig[];
export const MONSTERS = monsterData as MonsterConfig[];
export const BOTS = botData as BotConfig[];
export const COOKIES = cookieData as CookieConfig[];

export const PRIMARY_MONSTER = MONSTERS[0];
export const PRIMARY_BOT = BOTS[0];

export function getDifficulty(id: string): DifficultyConfig {
  return DIFFICULTIES.find((difficulty) => difficulty.id === id) ?? DIFFICULTIES[0];
}

export function getEnemyDisc(level: number): EnemyDiscConfig {
  return ENEMY_DISCS[Math.max(0, Math.min(level - 1, ENEMY_DISCS.length - 1))];
}

export function getUpgrade(id: string): UpgradeConfig | undefined {
  return COOKIE_UPGRADES.find((upgrade) => upgrade.id === id);
}
