import {
  ConfigValidationError,
  UnknownRecord,
  array,
  assertUnique,
  numberField,
  record,
  stringValue,
  validatePositiveNumberFields,
} from './primitives';

const FLOAT_TOLERANCE = 0.00001;

function expectClose(path: string, actual: number, expected: number): void {
  if (Math.abs(actual - expected) > FLOAT_TOLERANCE) {
    throw new ConfigValidationError(
      path,
      `난이도 확장 규칙 계산값 ${expected}이어야 합니다. 현재값: ${actual}`,
    );
  }
}

export function validateDifficultyExpansion(value: unknown): UnknownRecord {
  const path = 'DIFFICULTY_EXPANSION';
  const config = record(value, path);
  [
    'legacyDifficultyCount',
    'extensionDifficultyCount',
    'difficultySeriesSize',
    'enemyDiscSizeIncreasePerDifficulty',
    'maximumEnemyDiscSize',
    'maximumEnemyDiscSpeed',
    'minimumEnemyDiscCooldownMs',
  ].forEach((field) => numberField(config, field, path, { integer: true, min: 1 }));
  validatePositiveNumberFields(config, path, [
    'powerMultiplierPerDifficulty',
    'moveSpeedMultiplierPerDifficulty',
    'maximumMoveSpeed',
    'enemyDiscDamageMultiplierPerDifficulty',
    'enemyDiscSpeedMultiplierPerDifficulty',
    'enemyDiscCooldownMultiplierPerDifficulty',
  ]);
  if ((config.powerMultiplierPerDifficulty as number) <= 1) {
    throw new ConfigValidationError(
      `${path}.powerMultiplierPerDifficulty`,
      '1보다 커야 합니다.',
    );
  }
  if ((config.enemyDiscCooldownMultiplierPerDifficulty as number) > 1) {
    throw new ConfigValidationError(
      `${path}.enemyDiscCooldownMultiplierPerDifficulty`,
      '1 이하여야 합니다.',
    );
  }
  const prefixes = array(
    config.extensionSeriesPrefixes,
    `${path}.extensionSeriesPrefixes`,
  ).map((item, index) => stringValue(
    item,
    `${path}.extensionSeriesPrefixes[${index}]`,
  ));
  if (prefixes.length === 0) {
    throw new ConfigValidationError(
      `${path}.extensionSeriesPrefixes`,
      '확장 시리즈가 하나 이상이어야 합니다.',
    );
  }
  assertUnique(prefixes, `${path}.extensionSeriesPrefixes`);
  return config;
}

interface DifficultyExpansionReferences {
  expansion: UnknownRecord;
  difficulties: UnknownRecord[];
  enemyDiscs: UnknownRecord[];
  battleStageRulesValue: unknown;
  progressionValue: unknown;
}

export function validateDifficultyExpansionReferences({
  expansion,
  difficulties,
  enemyDiscs,
  battleStageRulesValue,
  progressionValue,
}: DifficultyExpansionReferences): void {
  const path = 'DIFFICULTY_EXPANSION';
  const legacyCount = expansion.legacyDifficultyCount as number;
  const extensionCount = expansion.extensionDifficultyCount as number;
  const seriesSize = expansion.difficultySeriesSize as number;
  const seriesPrefixes = expansion.extensionSeriesPrefixes as string[];
  if (seriesSize !== legacyCount) {
    throw new ConfigValidationError(
      `${path}.difficultySeriesSize`,
      `기본 난이도 수 ${legacyCount}와 같아야 합니다.`,
    );
  }
  if (extensionCount !== seriesSize * seriesPrefixes.length) {
    throw new ConfigValidationError(
      `${path}.extensionDifficultyCount`,
      `${seriesPrefixes.length}개 확장 시리즈 × ${seriesSize}단계여야 합니다.`,
    );
  }
  if (difficulties.length !== legacyCount + extensionCount) {
    throw new ConfigValidationError(
      'DIFFICULTIES',
      `기본 ${legacyCount}개와 확장 ${extensionCount}개여야 합니다.`,
    );
  }

  const baseNames = difficulties.slice(0, seriesSize).map((difficulty) => (
    difficulty.name as string
  ));
  difficulties.slice(legacyCount).forEach((difficulty, extensionIndex) => {
    const seriesIndex = Math.floor(extensionIndex / seriesSize);
    const baseIndex = extensionIndex % seriesSize;
    const expectedName = `${seriesPrefixes[seriesIndex]} ${baseNames[baseIndex]}`;
    if (difficulty.name !== expectedName) {
      throw new ConfigValidationError(
        `DIFFICULTIES[${legacyCount + extensionIndex}].name`,
        `확장 시리즈 이름 '${expectedName}'이어야 합니다.`,
      );
    }
  });

  const stageRules = record(battleStageRulesValue, 'BATTLE_STAGE_RULES');
  const progression = record(progressionValue, 'PROGRESSION');
  const completedWins = (progression.winsToUnlockNextDifficulty as number) - 1;
  const baseline = difficulties[0];
  const stageHpIncrease = (baseline.hpMultiplier as number)
    * completedWins
    * (stageRules.hpMultiplierPerWin as number);
  const stageAttackIncrease = (baseline.attackMultiplier as number)
    * completedWins
    * (stageRules.attackMultiplierPerWin as number);
  const stageMoveSpeedIncrease = (baseline.moveSpeed as number)
    * completedWins
    * (stageRules.moveSpeedMultiplierPerWin as number);

  difficulties.slice(legacyCount).forEach((difficulty, extensionIndex) => {
    const index = legacyCount + extensionIndex;
    const previous = difficulties[index - 1];
    const expectedHp = (
      (previous.hpMultiplier as number) + stageHpIncrease
    ) * (expansion.powerMultiplierPerDifficulty as number);
    const expectedAttack = (
      (previous.attackMultiplier as number) + stageAttackIncrease
    ) * (expansion.powerMultiplierPerDifficulty as number);
    const expectedMoveSpeed = Math.min(
      expansion.maximumMoveSpeed as number,
      ((previous.moveSpeed as number) + stageMoveSpeedIncrease)
        * (expansion.moveSpeedMultiplierPerDifficulty as number),
    );
    expectClose(`DIFFICULTIES[${index}].hpMultiplier`, difficulty.hpMultiplier as number, expectedHp);
    expectClose(
      `DIFFICULTIES[${index}].attackMultiplier`,
      difficulty.attackMultiplier as number,
      expectedAttack,
    );
    expectClose(
      `DIFFICULTIES[${index}].moveSpeed`,
      difficulty.moveSpeed as number,
      expectedMoveSpeed,
    );
    if ((difficulty.enemyDiscLevel as number) !== index + 1) {
      throw new ConfigValidationError(
        `DIFFICULTIES[${index}].enemyDiscLevel`,
        `신규 난이도 순번에 맞는 Lv.${index + 1}이어야 합니다.`,
      );
    }
  });

  enemyDiscs.slice(legacyCount, legacyCount + extensionCount).forEach((disc, extensionIndex) => {
    const index = legacyCount + extensionIndex;
    const previous = enemyDiscs[index - 1];
    const expectedDamage = Math.round(
      (previous.damage as number)
        * (expansion.enemyDiscDamageMultiplierPerDifficulty as number),
    );
    const expectedSize = Math.min(
      expansion.maximumEnemyDiscSize as number,
      (previous.size as number) + (expansion.enemyDiscSizeIncreasePerDifficulty as number),
    );
    const expectedSpeed = Math.min(
      expansion.maximumEnemyDiscSpeed as number,
      Math.round(
        (previous.speed as number)
          * (expansion.enemyDiscSpeedMultiplierPerDifficulty as number),
      ),
    );
    const expectedCooldown = Math.max(
      expansion.minimumEnemyDiscCooldownMs as number,
      Math.round(
        (previous.cooldownMs as number)
          * (expansion.enemyDiscCooldownMultiplierPerDifficulty as number),
      ),
    );
    [
      ['damage', expectedDamage],
      ['size', expectedSize],
      ['speed', expectedSpeed],
      ['cooldownMs', expectedCooldown],
    ].forEach(([field, expected]) => {
      if (disc[field as string] !== expected) {
        throw new ConfigValidationError(
          `ENEMY_DISCS[${index}].${field}`,
          `난이도 확장 규칙 계산값 ${expected}이어야 합니다.`,
        );
      }
    });
  });
}
