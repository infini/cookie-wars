import {
  ConfigValidationError,
  UnknownRecord,
  array,
  assertUnique,
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
  const expansionMigrations = array(
    config.difficultyExpansionMigrations,
    `${path}.difficultyExpansionMigrations`,
  ).map((item, index) => {
    const itemPath = `${path}.difficultyExpansionMigrations[${index}]`;
    const migration = record(item, itemPath);
    return {
      saveVersion: numberField(migration, 'saveVersion', itemPath, {
        integer: true,
        min: 1,
        max: currentSaveVersion,
      }),
      completedDifficultyCount: numberField(
        migration,
        'completedDifficultyCount',
        itemPath,
        { integer: true, min: 1 },
      ),
    };
  });
  if (expansionMigrations.length === 0) {
    throw new ConfigValidationError(
      `${path}.difficultyExpansionMigrations`,
      '난이도 확장 이전 규칙이 하나 이상이어야 합니다.',
    );
  }
  assertUnique(
    expansionMigrations.map((migration) => migration.saveVersion),
    `${path}.difficultyExpansionMigrations.saveVersion`,
  );
  expansionMigrations.slice(1).forEach((migration, index) => {
    const previous = expansionMigrations[index];
    if (
      migration.saveVersion <= previous.saveVersion
      || migration.completedDifficultyCount <= previous.completedDifficultyCount
    ) {
      throw new ConfigValidationError(
        `${path}.difficultyExpansionMigrations[${index + 1}]`,
        '저장 버전과 완료 난이도 수가 이전 행보다 커야 합니다.',
      );
    }
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
