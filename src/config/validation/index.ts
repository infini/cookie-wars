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
  validateCookieExpansion,
  validateCookieSuperCritical,
  validateCookies,
  validateDiscUpgradeRules,
  validateDiscs,
} from './economy';
import { validateCookieFeedback } from './feedback';
import { validateCookieFragments } from './cookieFragments';
import { validateCookiePity } from './cookiePity';
import { validateCookieSpecialEffects } from './cookieSpecialEffects';
import { validateMiniGame } from './miniGame';
import { validateClickerRobots } from './clickerRobots';
import {
  validateDifficultyExpansion,
  validateDifficultyExpansionReferences,
} from './difficultyExpansion';
import { ConfigValidationError } from './primitives';
import { validateReferences } from './references';
import { validateBattleRewards } from './rewards';
import { validateSaveMigrations } from './saveMigrations';
import {
  validateAudioSettings,
  validateBattleAuto,
  validateBattleAudio,
  validateBattleFeedback,
  validateBattleUi,
  validateBossSpecialAttack,
  validateGiantDisc,
  validateCookieInput,
} from './system';
import { GameConfigInput, ValidatedGameConfig } from './types';

export { ConfigValidationError };
export type { GameConfigInput, ValidatedGameConfig };

export function validateGameConfig(input: GameConfigInput): ValidatedGameConfig {
  validateMiniGame(input.MINI_GAME);
  validateAudioSettings(input.AUDIO_SETTINGS);
  validateBattleAuto(input.BATTLE_AUTO);
  validateCookieInput(input.COOKIE_INPUT);
  validateClickerRobots(input.CLICKER_ROBOTS);
  validateCookiePity(input.COOKIE_PITY);
  const cookieFeedback = validateCookieFeedback(input.COOKIE_FEEDBACK);
  const cookieFragments = validateCookieFragments(input.COOKIE_FRAGMENTS);
  const cookieSpecialEffects = validateCookieSpecialEffects(input.COOKIE_SPECIAL_EFFECTS);
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
  const cookieSuperCritical = validateCookieSuperCritical(input.COOKIE_SUPER_CRITICAL);
  const cookies = validateCookies(input.COOKIES);
  validateCookieExpansion(input.COOKIE_EXPANSION, cookies);
  const difficulties = validateDifficulties(input.DIFFICULTIES);
  const difficultyExpansion = validateDifficultyExpansion(input.DIFFICULTY_EXPANSION);
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
    cookieSuperCritical,
    cookieFragments,
    cookieFeedback,
    cookieSpecialEffects,
    clickerRobotsValue: input.CLICKER_ROBOTS,
    discUpgradeRulesValue: input.DISC_UPGRADE_RULES,
  });
  validateDifficultyExpansionReferences({
    expansion: difficultyExpansion,
    difficulties,
    enemyDiscs,
    battleStageRulesValue: input.BATTLE_STAGE_RULES,
    progressionValue: input.PROGRESSION,
  });

  return input as ValidatedGameConfig;
}
