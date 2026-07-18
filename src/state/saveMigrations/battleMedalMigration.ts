import { SAVE_MIGRATIONS } from '../../config';
import {
  clampSafeInteger,
  saturatingAdd,
  saturatingProductInteger,
} from '../../domain/safeNumbers';
import { normalizeStoredSaveVersion } from './saveVersion';

interface BattleMedalMigrationInput {
  savedVersion: unknown;
  savedBattleMedals: unknown;
  normalizedDifficultyWinCounts: Record<string, number>;
}

export function resolveBattleMedals({
  savedVersion,
  savedBattleMedals,
  normalizedDifficultyWinCounts,
}: BattleMedalMigrationInput): number {
  const normalizedSaveVersion = normalizeStoredSaveVersion(savedVersion);
  if (normalizedSaveVersion >= SAVE_MIGRATIONS.battleMedalMigrationVersion) {
    return clampSafeInteger(savedBattleMedals);
  }

  const legacyWins = Object.values(normalizedDifficultyWinCounts).reduce(
    (total, wins) => saturatingAdd(total, wins),
    0,
  );
  return saturatingProductInteger(
    legacyWins,
    SAVE_MIGRATIONS.battleMedalsPerLegacyWin,
  );
}
