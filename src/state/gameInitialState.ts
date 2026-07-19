import {
  AUDIO_SETTINGS,
  BATTLE_AUTO,
  BATTLE_RULES,
  DIFFICULTIES,
  DISCS,
  SAVE_MIGRATIONS,
} from '../config';
import {
  makeInitialBotCounts,
  makeInitialDiscLevels,
  makeInitialUpgradeLevels,
} from '../domain/gameSelectors';
import { GameState } from '../types/game';
import { INITIAL_COOKIE_PITY_MISSES } from '../domain/cookiePity';

const initialDifficultyWinCounts = Object.fromEntries(
  DIFFICULTIES.map((difficulty) => [difficulty.id, 0]),
);

export const initialGameState: GameState = {
  saveVersion: SAVE_MIGRATIONS.currentSaveVersion,
  cookies: 0,
  lifetimeCookies: 0,
  upgradeLevels: makeInitialUpgradeLevels(),
  legacyCookieEvolutionBonusLevels: 0,
  ownedDiscIds: [],
  discLevels: makeInitialDiscLevels(),
  discUpgradeSpentCookies: Object.fromEntries(DISCS.map((disc) => [disc.id, 0])),
  selectedDiscId: DISCS[0].id,
  botCounts: makeInitialBotCounts(),
  selectedDifficultyId: DIFFICULTIES[0].id,
  highestUnlockedDifficultyIndex: 0,
  difficultyWinCounts: initialDifficultyWinCounts,
  clearedDifficultyIds: [],
  rewardClaimedStageIds: [],
  giantDiscCount: 0,
  battleMedals: 0,
  discoveredMonsterIds: [],
  newMonsterIds: [],
  soundEnabled: true,
  soundVolumeLevel: AUDIO_SETTINGS.defaultLevel,
  vibrationEnabled: true,
  battleSpeedMultiplier: BATTLE_RULES.defaultBattleSpeedMultiplier,
  autoBattleEnabled: BATTLE_AUTO.defaultEnabled,
  cookiePityMisses: INITIAL_COOKIE_PITY_MISSES,
  lastSavedAt: 0,
};
