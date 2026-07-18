import { SAVE_MIGRATIONS } from '../../config';
import {
  clampSafeInteger,
  saturatingSubtract,
} from '../../domain/safeNumbers';
import { normalizeStoredSaveVersion } from './saveVersion';

interface CookieEvolutionMigrationInput {
  savedVersion: unknown;
  savedBonusLevels: unknown;
  savedUpgradeLevels?: Record<string, number>;
}

export function resolveCookieEvolutionBonusLevels({
  savedVersion,
  savedBonusLevels,
  savedUpgradeLevels,
}: CookieEvolutionMigrationInput): number {
  const normalizedSaveVersion = normalizeStoredSaveVersion(savedVersion);
  if (normalizedSaveVersion >= SAVE_MIGRATIONS.cookieEvolutionBonusMigrationVersion) {
    return clampSafeInteger(savedBonusLevels);
  }

  const legacyUpgrade = SAVE_MIGRATIONS.cookieEvolutionLegacyUpgrade;
  const rawLevel = savedUpgradeLevels?.[legacyUpgrade.id];
  const normalizedLevel = clampSafeInteger(rawLevel, {
    fallback: legacyUpgrade.baseLevel,
    minimum: legacyUpgrade.baseLevel,
  });
  const isInLegacyRange = typeof rawLevel === 'number'
    && Number.isFinite(rawLevel)
    && rawLevel >= legacyUpgrade.baseLevel
    && normalizedLevel <= legacyUpgrade.maximumLevel;
  const savedLevel = isInLegacyRange ? normalizedLevel : legacyUpgrade.baseLevel;
  return saturatingSubtract(savedLevel, legacyUpgrade.baseLevel);
}
