import {
  ConfigValidationError,
  UnknownRecord,
  numberField,
  record,
  stringValue,
} from './primitives';

export function validateSaveMigrations(value: unknown): UnknownRecord {
  const path = 'SAVE_MIGRATIONS';
  const config = record(value, path);
  const currentSaveVersion = numberField(config, 'currentSaveVersion', path, {
    integer: true,
    min: 1,
  });
  numberField(config, 'cookieEvolutionBonusMigrationVersion', path, {
    integer: true,
    min: 1,
    max: currentSaveVersion,
  });
  numberField(config, 'battleMedalMigrationVersion', path, {
    integer: true,
    min: 1,
    max: currentSaveVersion,
  });
  numberField(config, 'difficultyExpansionMigrationVersion', path, {
    integer: true,
    min: 1,
    max: currentSaveVersion,
  });
  numberField(config, 'battleMedalsPerLegacyWin', path, {
    integer: true,
    min: 1,
  });

  const legacyUpgradePath = `${path}.cookieEvolutionLegacyUpgrade`;
  const legacyUpgrade = record(config.cookieEvolutionLegacyUpgrade, legacyUpgradePath);
  stringValue(legacyUpgrade.id, `${legacyUpgradePath}.id`);
  const baseLevel = numberField(legacyUpgrade, 'baseLevel', legacyUpgradePath, {
    integer: true,
    min: 1,
  });
  numberField(legacyUpgrade, 'maximumLevel', legacyUpgradePath, {
    integer: true,
    min: baseLevel,
  });

  ['botIdAliases', 'discIdAliases', 'monsterIdAliases'].forEach((field) => {
    const aliases = record(config[field], `${path}.${field}`);
    Object.entries(aliases).forEach(([legacyId, currentId]) => {
      if (legacyId.trim().length === 0) {
        throw new ConfigValidationError(`${path}.${field}`, '별칭 ID가 비어 있을 수 없습니다.');
      }
      stringValue(currentId, `${path}.${field}.${legacyId}`);
    });
  });
  return config;
}
