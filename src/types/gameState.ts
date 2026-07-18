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
  battleMedals: number;
  discoveredMonsterIds: string[];
  newMonsterIds: string[];
  soundEnabled: boolean;
  soundVolumeLevel: SoundVolumeLevel;
  vibrationEnabled: boolean;
  battleSpeedMultiplier: number;
  lastSavedAt: number;
}

export interface CookieStats {
  clickPower: number;
  criticalChanceUnits: number;
  criticalRewardMultiplier: number;
  cookieRenderSize: number;
  autoProduction: number;
  maxHealth: number;
  cookieLevel: number;
  activeCookieId: string;
  totalUpgradeLevels: number;
}

export interface CookieClickResult {
  amount: number;
  critical: boolean;
}

export interface BattleRewardResult {
  firstClear: boolean;
  giantDiscReward: number;
  battleMedalReward: number;
  totalBattleMedals: number;
  stageNumber: number;
  difficultyWins: number;
  winsRequired: number;
  unlockedNextDifficulty: boolean;
}
