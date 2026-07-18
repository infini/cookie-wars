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
  validateAnimationFrameVisibility,
  validateBossAnimation,
  validateBotAnimation,
} from './animation';
import {
  validateBots,
  validateCookieUpgradeRules,
  validateCookieUpgrades,
  validateCookieCritical,
  validateCookies,
  validateDiscUpgradeRules,
  validateDiscs,
} from './economy';
import { ConfigValidationError } from './primitives';
import { validateReferences } from './references';
import { validateBattleRewards } from './rewards';
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
  validateBattleRewards(input.BATTLE_REWARDS);
  validateBattleStageRules(input.BATTLE_STAGE_RULES);
  validateBattleUi(input.BATTLE_UI);
  const bossAnimations = validateBossAnimation(input.BOSS_ANIMATION);
  validateBossBalance(input.BOSS_BALANCE);
  validateBossBehavior(input.BOSS_BEHAVIOR);
  validateBossSpecialAttack(input.BOSS_SPECIAL_ATTACK);
  const botAnimations = validateBotAnimation(input.BOT_ANIMATION);
  validateAnimationFrameVisibility(
    input.BATTLE_RULES,
    input.BOSS_ANIMATION,
    input.BOT_ANIMATION,
  );
  const bots = validateBots(input.BOTS);
  const upgradeRules = validateCookieUpgradeRules(input.COOKIE_UPGRADE_RULES);
  const upgrades = validateCookieUpgrades(input.COOKIE_UPGRADES);
  const cookieCritical = validateCookieCritical(input.COOKIE_CRITICAL);
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
    bossAnimations,
    botAnimations,
    cookieCritical,
  });

  return input as ValidatedGameConfig;
}
