import {
  DIFFICULTIES,
  DIFFICULTY_EXPANSION,
  PROGRESSION,
  SAVE_MIGRATIONS,
} from '../../config';
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

  const legacyFinalIndex = DIFFICULTY_EXPANSION.legacyDifficultyCount - 1;
  const firstExpansionIndex = DIFFICULTY_EXPANSION.legacyDifficultyCount;
  const legacyFinal = DIFFICULTIES[legacyFinalIndex];
  const shouldAdvanceLegacyCompletion = clampSafeInteger(savedVersion)
    < SAVE_MIGRATIONS.difficultyExpansionMigrationVersion
    && highestUnlockedDifficultyIndex >= firstExpansionIndex
    && difficultyWinCounts[legacyFinal.id] >= PROGRESSION.winsToUnlockNextDifficulty;
  return shouldAdvanceLegacyCompletion
    ? DIFFICULTIES[firstExpansionIndex].id
    : DIFFICULTIES[selectedIndex].id;
}
