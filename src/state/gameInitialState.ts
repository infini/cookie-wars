import { AUDIO_SETTINGS, DIFFICULTIES, DISCS, SAVE_MIGRATIONS } from '../config';
import {
  makeInitialBotCounts,
  makeInitialDiscLevels,
  makeInitialUpgradeLevels,
} from '../domain/gameSelectors';
import { GameState } from '../types/game';

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
  lastSavedAt: 0,
};
