import {
  validateBattleMaps,
  validateBattleRules,
  validateBattleStageRules,
  validateBossBalance,
  validateBossBehavior,
  validateDifficulties,
  validateEnemyDiscs,
  validateEnemyWaves,
  validateMonsters,
  validateProgression,
} from './combat';
import {
  validateBots,
  validateCookieUpgradeRules,
  validateCookieUpgrades,
  validateCookies,
  validateDiscUpgradeRules,
  validateDiscs,
} from './economy';
import { ConfigValidationError } from './primitives';
import { validateReferences } from './references';
import { validateSaveMigrations } from './saveMigrations';
import {
  validateAudioSettings,
  validateBattleAudio,
  validateBattleFeedback,
  validateBattleUi,
  validateBossSpecialAttack,
  validateGiantDisc,
} from './system';
import { GameConfigInput, ValidatedGameConfig } from './types';

export { ConfigValidationError };
export type { GameConfigInput, ValidatedGameConfig };

export function validateGameConfig(input: GameConfigInput): ValidatedGameConfig {
  validateAudioSettings(input.AUDIO_SETTINGS);
  validateBattleAudio(input.BATTLE_AUDIO);
  validateBattleFeedback(input.BATTLE_FEEDBACK);
  const maps = validateBattleMaps(input.BATTLE_MAPS);
  validateBattleRules(input.BATTLE_RULES);
  validateBattleStageRules(input.BATTLE_STAGE_RULES);
  validateBattleUi(input.BATTLE_UI);
  validateBossBalance(input.BOSS_BALANCE);
  validateBossBehavior(input.BOSS_BEHAVIOR);
  validateBossSpecialAttack(input.BOSS_SPECIAL_ATTACK);
  const bots = validateBots(input.BOTS);
  const upgradeRules = validateCookieUpgradeRules(input.COOKIE_UPGRADE_RULES);
  const upgrades = validateCookieUpgrades(input.COOKIE_UPGRADES);
  validateCookies(input.COOKIES);
  const difficulties = validateDifficulties(input.DIFFICULTIES);
  validateDiscUpgradeRules(input.DISC_UPGRADE_RULES);
  const discs = validateDiscs(input.DISCS);
  const enemyDiscs = validateEnemyDiscs(input.ENEMY_DISCS);
  const waves = validateEnemyWaves(input.ENEMY_WAVES);
  validateGiantDisc(input.GIANT_DISC);
  const monsters = validateMonsters(input.MONSTERS);
  validateProgression(input.PROGRESSION);
  const migrations = validateSaveMigrations(input.SAVE_MIGRATIONS);
  validateReferences({
    maps,
    upgrades,
    upgradeRules,
    difficulties,
    enemyDiscs,
    waves,
    monsters,
    bots,
    discs,
    migrations,
  });

  return input as ValidatedGameConfig;
}
