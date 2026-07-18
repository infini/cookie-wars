export interface ProgressionConfig {
  winsToUnlockNextDifficulty: number;
  giantDiscRewardPerFirstClear: number;
  saveDebounceMs: number;
  autoProductionIntervalMs: number;
}

export interface SaveMigrationsConfig {
  currentSaveVersion: number;
  cookieEvolutionBonusMigrationVersion: number;
  cookieEvolutionLegacyUpgrade: {
    id: string;
    baseLevel: number;
    maximumLevel: number;
  };
  botIdAliases: Record<string, string>;
  discIdAliases: Record<string, string>;
  monsterIdAliases: Record<string, string>;
}
