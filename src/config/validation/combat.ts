import {
  ConfigValidationError,
  UnknownRecord,
  array,
  assertUnique,
  numberField,
  record,
  stringValue,
  validateIdTable,
  validateLevelRows,
  validateNumberFields,
  validatePositiveNumberFields,
  validateStringFields,
} from './primitives';

function validateRatioFields(
  config: UnknownRecord,
  path: string,
  fields: readonly string[],
): void {
  fields.forEach((field) => numberField(config, field, path, { min: 0, max: 1 }));
}

export function validateBattleMaps(value: unknown): UnknownRecord[] {
  const path = 'BATTLE_MAPS';
  const maps = validateIdTable(value, path);
  maps.forEach((map, index) => validateStringFields(map, `${path}[${index}]`, [
    'difficultyId', 'name', 'imageKey',
  ]));
  assertUnique(maps.map((map) => map.difficultyId as string), `${path}.difficultyId`);
  return maps;
}

export function validateBattleRules(value: unknown): void {
  const path = 'BATTLE_RULES';
  const config = record(value, path);
  validateNumberFields(config, path, [
    'tickMs', 'maxDeltaMs', 'enemyX', 'enemyStartY', 'enemyStopY', 'enemyMoveDivisor',
    'enemyFirstShotDelayMs', 'enemyProjectileStartOffsetY', 'enemyProjectileMoveDivisor',
    'enemyMeleeTriggerY', 'enemyMeleeIntervalMs', 'coreProjectileHitY', 'playerStartX',
    'playerStartY', 'castleAttackRadius', 'botAttackRadius', 'enemyAttackRadius',
    'maximumSimultaneousEnemyProjectiles', 'botDiscSizeMultiplier', 'playerHomingMs',
    'playerProjectileMoveDivisor', 'playerProjectileMinimumFlightMs', 'playerHitToleranceY',
    'playerHitToleranceX', 'playerProjectileEndY', 'castleDiscDamageMultiplier',
    'maxRenderedPlayerDiscSize', 'resultNoticeMs',
  ]);
  validatePositiveNumberFields(config, path, [
    'tickMs', 'maxDeltaMs', 'enemyMoveDivisor', 'enemyProjectileMoveDivisor',
    'enemyMeleeIntervalMs', 'playerHomingMs', 'playerProjectileMoveDivisor',
    'playerProjectileMinimumFlightMs', 'resultNoticeMs',
  ]);
  validatePositiveNumberFields(
    config,
    path,
    ['maximumSimultaneousEnemyProjectiles'],
    { integer: true },
  );
  validateRatioFields(config, path, [
    'enemyX', 'enemyStartY', 'enemyStopY', 'enemyMeleeTriggerY', 'coreProjectileHitY',
    'playerStartX', 'playerStartY', 'castleAttackRadius', 'botAttackRadius',
    'enemyAttackRadius', 'playerHitToleranceY', 'playerHitToleranceX',
  ]);
  if ((config.enemyStartY as number) >= (config.enemyStopY as number)) {
    throw new ConfigValidationError(
      `${path}.enemyStopY`,
      'enemyStartY보다 커야 합니다.',
    );
  }
  if (
    (config.enemyMeleeTriggerY as number) < (config.enemyStartY as number)
    || (config.enemyMeleeTriggerY as number) > (config.enemyStopY as number)
  ) {
    throw new ConfigValidationError(
      `${path}.enemyMeleeTriggerY`,
      'enemyStartY와 enemyStopY 사이여야 합니다.',
    );
  }
  array(config.botFormationSlots, `${path}.botFormationSlots`).forEach((item, index) => {
    const itemPath = `${path}.botFormationSlots[${index}]`;
    const slot = record(item, itemPath);
    validateRatioFields(slot, itemPath, ['x', 'y']);
  });
}

export function validateBattleStageRules(value: unknown): void {
  const path = 'BATTLE_STAGE_RULES';
  const config = record(value, path);
  validateNumberFields(config, path, [
    'hpMultiplierPerWin', 'attackMultiplierPerWin', 'moveSpeedMultiplierPerWin',
  ], { min: 0 });
  validateNumberFields(config, path, [
    'extraEnemiesPerStep', 'maximumExtraEnemies',
  ], { integer: true, min: 0 });
  validatePositiveNumberFields(
    config,
    path,
    ['extraEnemyEveryWins', 'enemyDiscLevelEveryWins'],
    { integer: true },
  );
}

export function validateBossBalance(value: unknown): void {
  const path = 'BOSS_BALANCE';
  const config = record(value, path);
  validateNumberFields(config, path, [
    'playerPowerBaseSurvivalSeconds', 'hpMultiplierReference', 'hpScalingExponent',
    'maximumPowerScaledSurvivalSeconds', 'minimumAutomaticHitsToDefeat',
  ], { min: 0 });
  validatePositiveNumberFields(config, path, [
    'hpMultiplierReference', 'maximumPowerScaledSurvivalSeconds',
  ]);
  validatePositiveNumberFields(
    config,
    path,
    ['minimumAutomaticHitsToDefeat'],
    { integer: true },
  );
  if (
    (config.maximumPowerScaledSurvivalSeconds as number)
    < (config.playerPowerBaseSurvivalSeconds as number)
  ) {
    throw new ConfigValidationError(
      `${path}.maximumPowerScaledSurvivalSeconds`,
      'playerPowerBaseSurvivalSeconds 이상이어야 합니다.',
    );
  }
}

export function validateBossBehavior(value: unknown): void {
  const path = 'BOSS_BEHAVIOR';
  const config = record(value, path);
  validateNumberFields(config, path, [
    'globalAttackDamageMultiplier', 'globalAttackCooldownMultiplier',
    'globalMoveSpeedMultiplier', 'globalDifficultyMultiplier', 'enrageHealthRatio',
    'enrageAttackCooldownMultiplier', 'enrageProjectileDamageMultiplier',
    'enrageMeleeDamageMultiplier', 'enrageAnnouncementMs',
  ], { min: 0 });
  validatePositiveNumberFields(config, path, [
    'globalAttackCooldownMultiplier', 'enrageAttackCooldownMultiplier',
  ]);
  numberField(config, 'enrageHealthRatio', path, { min: 0, max: 1 });
}

export function validateDifficulties(value: unknown): UnknownRecord[] {
  const path = 'DIFFICULTIES';
  const difficulties = validateIdTable(value, path);
  difficulties.forEach((difficulty, index) => {
    const itemPath = `${path}[${index}]`;
    validateStringFields(difficulty, itemPath, ['name', 'enemyWaveId']);
    numberField(difficulty, 'enemyCount', itemPath, { integer: true, min: 1 });
    validateNumberFields(difficulty, itemPath, ['hpMultiplier', 'attackMultiplier', 'moveSpeed'], {
      min: 0,
    });
    numberField(difficulty, 'enemyDiscLevel', itemPath, { integer: true, min: 1 });
  });
  return difficulties;
}

export function validateEnemyDiscs(value: unknown): UnknownRecord[] {
  const path = 'ENEMY_DISCS';
  const discs = validateLevelRows(value, path, ['damage', 'size', 'speed', 'cooldownMs']);
  discs.forEach((disc, index) => validatePositiveNumberFields(
    disc,
    `${path}[${index}]`,
    ['cooldownMs'],
  ));
  return discs;
}

export function validateEnemyWaves(value: unknown): UnknownRecord[] {
  const path = 'ENEMY_WAVES';
  const waves = validateIdTable(value, path);
  waves.forEach((wave, index) => {
    const itemPath = `${path}[${index}]`;
    validateStringFields(wave, itemPath, ['name', 'bossMonsterId']);
    array(wave.monsterPatternIds, `${itemPath}.monsterPatternIds`).forEach(
      (monsterId, monsterIndex) => stringValue(
        monsterId,
        `${itemPath}.monsterPatternIds[${monsterIndex}]`,
      ),
    );
    numberField(wave, 'bossEveryEnemies', itemPath, { integer: true, min: 1 });
  });
  return waves;
}

export function validateMonsters(value: unknown): UnknownRecord[] {
  const path = 'MONSTERS';
  const monsters = validateIdTable(value, path);
  monsters.forEach((monster, index) => {
    const itemPath = `${path}[${index}]`;
    validateStringFields(monster, itemPath, ['imageKey', 'name', 'rank', 'description']);
    validateNumberFields(monster, itemPath, ['baseHp', 'baseAttack'], {
      integer: true,
      min: 0,
    });
    validateNumberFields(monster, itemPath, [
      'moveSpeedMultiplier', 'discDamageMultiplier', 'sizeMultiplier',
    ], { min: 0 });
  });
  return monsters;
}

export function validateProgression(value: unknown): void {
  const path = 'PROGRESSION';
  const config = record(value, path);
  [
    'winsToUnlockNextDifficulty', 'giantDiscRewardPerFirstClear', 'saveDebounceMs',
    'autoProductionIntervalMs',
  ].forEach((field) => numberField(config, field, path, { integer: true, min: 0 }));
  if ((config.winsToUnlockNextDifficulty as number) < 1) {
    throw new ConfigValidationError(
      `${path}.winsToUnlockNextDifficulty`,
      '1 이상이어야 합니다.',
    );
  }
  if ((config.autoProductionIntervalMs as number) < 1) {
    throw new ConfigValidationError(`${path}.autoProductionIntervalMs`, '1 이상이어야 합니다.');
  }
}
