import type { SoundVolumeLevel } from './audio';
import type { CookieFragmentKind } from './cookieFragments';
import type { CookiePityMisses, CriticalPityKind } from './cookiePity';

export interface GameState {
  saveVersion: number;
  cookies: number;
  lifetimeCookies: number;
  upgradeLevels: Record<string, number>;
  legacyCookieEvolutionBonusLevels: number;
  ownedDiscIds: string[];
  discLevels: Record<string, number>;
  discUpgradeSpentCookies: Record<string, number>;
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
  autoBattleEnabled: boolean;
  cookiePityMisses: CookiePityMisses;
  lastSavedAt: number;
}

export interface CookieStats {
  clickPower: number;
  criticalChanceUnits: number;
  criticalRewardMultiplier: number;
  superCriticalChanceUnits: number;
  superCriticalRewardMultiplier: number;
  cookieRenderSize: number;
  autoProduction: number;
  maxHealth: number;
  cookieLevel: number;
  activeCookieId: string;
  totalUpgradeLevels: number;
  clickerRobotCount: number;
  clickerRobotPostCapLevel: number;
  clickerRobotClicksPerSecond: number;
  clickerRobotPowerPerHit: number;
  clickerRobotCookiesPerSecond: number;
}

export type CookieClickKind = 'normal' | CriticalPityKind;

export interface CookieClickResult {
  amount: number;
  kind: CookieClickKind;
  spawnedFragmentKind?: CookieFragmentKind;
}

export interface CookieFragmentRewardResult {
  kind: CookieFragmentKind;
  amount: number;
  multiplier: number;
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
