export interface ProgressionConfig {
  winsToUnlockNextDifficulty: number;
  giantDiscRewardPerFirstClear: number;
  saveDebounceMs: number;
  autoProductionIntervalMs: number;
}

export interface BattleRewardsConfig {
  battleMedalsPerStageClear: number;
  clickPowerBonusPercentPerMedal: number;
  autoProductionBonusPercentPerMedal: number;
  castleHealthBonusPercentPerMedal: number;
}

export interface SaveMigrationsConfig {
  currentSaveVersion: number;
  cookieEvolutionBonusMigrationVersion: number;
  battleMedalMigrationVersion: number;
  battleMedalsPerLegacyWin: number;
  cookieEvolutionLegacyUpgrade: {
    id: string;
    baseLevel: number;
    maximumLevel: number;
  };
  botIdAliases: Record<string, string>;
  discIdAliases: Record<string, string>;
  monsterIdAliases: Record<string, string>;
}
