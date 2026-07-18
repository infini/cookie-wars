import type { SoundVolumeLevel } from './audio';

export interface GameState {
  saveVersion: number;
  cookies: number;
  lifetimeCookies: number;
  upgradeLevels: Record<string, number>;
  legacyCookieEvolutionBonusLevels: number;
  ownedDiscIds: string[];
  discLevels: Record<string, number>;
  selectedDiscId: string;
  botCounts: Record<string, number>;
  selectedDifficultyId: string;
  highestUnlockedDifficultyIndex: number;
  difficultyWinCounts: Record<string, number>;
  clearedDifficultyIds: string[];
  rewardClaimedStageIds: string[];
  giantDiscCount: number;
  discoveredMonsterIds: string[];
  newMonsterIds: string[];
  soundEnabled: boolean;
  soundVolumeLevel: SoundVolumeLevel;
  vibrationEnabled: boolean;
  lastSavedAt: number;
}

export interface CookieStats {
  clickPower: number;
  cookieRenderSize: number;
  autoProduction: number;
  maxHealth: number;
  cookieLevel: number;
  activeCookieId: string;
  totalUpgradeLevels: number;
}

export interface BattleRewardResult {
  firstClear: boolean;
  giantDiscReward: number;
  stageNumber: number;
  difficultyWins: number;
  winsRequired: number;
  unlockedNextDifficulty: boolean;
}
