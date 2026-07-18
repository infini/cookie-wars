import { BOTS, COOKIE_UPGRADES, DISCS } from '../../config';

export function makeInitialUpgradeLevels(): Record<string, number> {
  return Object.fromEntries(
    COOKIE_UPGRADES.map((upgrade) => [upgrade.id, upgrade.levels[0].level]),
  );
}

export function makeInitialBotCounts(): Record<string, number> {
  return Object.fromEntries(BOTS.map((bot) => [bot.id, 0]));
}

export function makeInitialDiscLevels(): Record<string, number> {
  return Object.fromEntries(DISCS.map((disc) => [disc.id, disc.levels[0].level]));
}
