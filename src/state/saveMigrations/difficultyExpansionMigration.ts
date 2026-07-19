import { DIFFICULTIES, PROGRESSION, SAVE_MIGRATIONS } from '../../config';
import { clampSafeInteger } from '../../domain/safeNumbers';

interface DifficultySelectionMigrationOptions {
  savedVersion: unknown;
  savedDifficultyId: unknown;
  highestUnlockedDifficultyIndex: number;
  difficultyWinCounts: Record<string, number>;
}

export function resolveSelectedDifficultyAfterExpansion({
  savedVersion,
  savedDifficultyId,
  highestUnlockedDifficultyIndex,
  difficultyWinCounts,
}: DifficultySelectionMigrationOptions): string {
  const selectedIndex = typeof savedDifficultyId === 'string'
    ? DIFFICULTIES.findIndex((difficulty) => difficulty.id === savedDifficultyId)
    : -1;
  const fallbackId = DIFFICULTIES[highestUnlockedDifficultyIndex].id;
  if (selectedIndex < 0 || selectedIndex > highestUnlockedDifficultyIndex) {
    return fallbackId;
  }

  const normalizedSaveVersion = clampSafeInteger(savedVersion);
  const migration = [...SAVE_MIGRATIONS.difficultyExpansionMigrations]
    .reverse()
    .find(({ saveVersion, completedDifficultyCount }) => {
      const completedFinal = DIFFICULTIES[completedDifficultyCount - 1];
      return normalizedSaveVersion < saveVersion
        && highestUnlockedDifficultyIndex >= completedDifficultyCount
        && difficultyWinCounts[completedFinal.id] >= PROGRESSION.winsToUnlockNextDifficulty;
    });
  if (migration && selectedIndex < migration.completedDifficultyCount) {
    return DIFFICULTIES[migration.completedDifficultyCount].id;
  }
  return DIFFICULTIES[selectedIndex].id;
}
