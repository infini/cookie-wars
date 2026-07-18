import {
  ConfigValidationError,
  array,
  numberField,
  record,
  stringValue,
  validateNumberFields,
  validatePositiveNumberFields,
  validateStringFields,
} from './primitives';

export function validateAudioSettings(value: unknown): void {
  const path = 'AUDIO_SETTINGS';
  const config = record(value, path);
  const defaultLevel = numberField(config, 'defaultLevel', path, {
    integer: true,
    min: 1,
    max: 5,
  });
  numberField(config, 'previewDelayMs', path, { integer: true, min: 0 });
  const volumeMultipliers = record(
    config.soundVolumeMultipliers,
    `${path}.soundVolumeMultipliers`,
  );
  validateNumberFields(volumeMultipliers, `${path}.soundVolumeMultipliers`, [
    'cookie', 'critical', 'menu', 'upgrade', 'blocked',
  ], { min: 0, max: 1 });
  const levels = array(config.levels, `${path}.levels`).map((item, index) => {
    const itemPath = `${path}.levels[${index}]`;
    const level = record(item, itemPath);
    numberField(level, 'level', itemPath, { integer: true, min: 1, max: 5 });
    numberField(level, 'volume', itemPath, { min: 0, max: 1 });
    return level;
  });
  const levelNumbers = levels.map((level) => level.level as number);
  const expectedLevels = [1, 2, 3, 4, 5];
  if (levelNumbers.length !== expectedLevels.length) {
    throw new ConfigValidationError(
      `${path}.levels`,
      '1단계부터 5단계까지 정확히 다섯 개여야 합니다.',
    );
  }
  levelNumbers.forEach((level, index) => {
    if (level !== expectedLevels[index]) {
      throw new ConfigValidationError(
        `${path}.levels[${index}].level`,
        `${expectedLevels[index]}단계여야 합니다.`,
      );
    }
  });
  levels.slice(1).forEach((level, index) => {
    const previousVolume = levels[index].volume as number;
    const volume = level.volume as number;
    if (volume <= previousVolume) {
      throw new ConfigValidationError(
        `${path}.levels[${index + 1}].volume`,
        '이전 단계보다 커야 합니다.',
      );
    }
  });
  if (!levelNumbers.includes(defaultLevel)) {
    throw new ConfigValidationError(`${path}.defaultLevel`, 'levels에 정의된 값이어야 합니다.');
  }
}

export function validateBattleAudio(value: unknown): void {
  const path = 'BATTLE_AUDIO';
  const config = record(value, path);
  const minimumIntervals = record(config.minimumIntervalMs, `${path}.minimumIntervalMs`);
  validateNumberFields(minimumIntervals, `${path}.minimumIntervalMs`, [
    'friendlyDisc', 'enemyDisc', 'giantDisc', 'hitLight', 'hitHeavy', 'bossMelee', 'bossEnrage',
  ], { min: 0 });
  const volumes = record(config.volumeMultipliers, `${path}.volumeMultipliers`);
  validateNumberFields(volumes, `${path}.volumeMultipliers`, [
    'friendlyDisc', 'enemyDisc', 'giantDisc', 'hitLight1', 'hitLight2', 'hitLight3',
    'hitHeavy', 'bossMelee', 'bossEnrage', 'battleMusic',
  ], { min: 0, max: 1 });
}

export function validateBattleFeedback(value: unknown): void {
  const path = 'BATTLE_FEEDBACK';
  const config = record(value, path);
  validateNumberFields(config, path, [
    'enemyAttackDurationMs', 'enemyAttackWindupMs', 'enemyAttackLungePixels', 'enemyAttackScale',
    'enemyAttackWindupScale', 'enemyAttackShakeCycles', 'enemyHitDurationMs',
    'enemyHitShakePixels', 'enemyHitScale', 'enemyHitShakeCycles', 'auraSizeMultiplier',
    'enragePulseScale', 'castleHitDurationMs', 'castleHitShakePixels', 'castleHitScale',
    'impactEffectDurationMs', 'impactBurstDurationMs', 'impactEffectSize',
    'impactRingBorderWidth', 'impactStartScale', 'impactEndScale', 'impactInnerScale',
    'impactSparkCount', 'impactSparkLength', 'impactSparkWidth', 'impactSparkTravelPixels',
    'impactSparkEndScale', 'fieldShockwaveDurationMs', 'fieldShockwaveSize',
    'fieldShockwaveHeightRatio', 'fieldShockwaveStartScale', 'fieldShockwaveEndScale',
    'fieldShockwaveMaximumOpacity', 'fieldShockwaveBorderWidth', 'damageTextRisePixels',
    'enemyProjectileTrailLengthMultiplier', 'enemyProjectileTrailWidthMultiplier',
    'enemyProjectileTrailOpacity', 'enemyProjectileGlowRadius', 'attackAuraBorderWidth',
    'screenFlashMaximumOpacity', 'damageTextFontSize', 'damageTextWidth',
  ], { min: 0 });
  validateStringFields(config, path, [
    'attackAuraColor', 'attackAuraBorderColor', 'enrageAuraColor', 'enrageAuraBorderColor',
    'impactOuterColor', 'impactInnerColor', 'impactSparkColor', 'impactSecondaryColor',
    'castleImpactOuterColor', 'castleImpactInnerColor', 'castleImpactSparkColor',
    'castleImpactSecondaryColor', 'screenFlashColor', 'damageTextColor', 'damageTextOutlineColor',
  ]);
  validatePositiveNumberFields(config, path, [
    'enemyAttackDurationMs', 'enemyAttackWindupMs', 'enemyHitDurationMs',
    'castleHitDurationMs', 'impactEffectDurationMs', 'impactBurstDurationMs',
    'fieldShockwaveDurationMs',
  ]);
  validatePositiveNumberFields(config, path, ['impactSparkCount'], { integer: true });
  [
    'fieldShockwaveMaximumOpacity',
    'enemyProjectileTrailOpacity',
    'screenFlashMaximumOpacity',
  ].forEach((field) => numberField(config, field, path, { min: 0, max: 1 }));
  array(config.impactBursts, `${path}.impactBursts`).forEach((item, index) => {
    const itemPath = `${path}.impactBursts[${index}]`;
    const burst = record(item, itemPath);
    numberField(burst, 'xRatio', itemPath, { min: -1, max: 1 });
    numberField(burst, 'yRatio', itemPath, { min: -1, max: 1 });
    numberField(burst, 'delayMs', itemPath, { integer: true, min: 0 });
    numberField(burst, 'scale', itemPath, { min: Number.EPSILON });
    numberField(burst, 'rotationDeg', itemPath);
  });
}

export function validateBattleUi(value: unknown): void {
  const path = 'BATTLE_UI';
  const config = record(value, path);
  validateNumberFields(config, path, [
    'castleRenderSize', 'castleTouchWidth', 'botRenderSize', 'botLabelWidth',
    'enemyBaseRenderSize', 'enemyMinimumRenderSize', 'enemyMaximumRenderSize',
    'enemyLabelWidth', 'enemyHealthWidth', 'castleHealthWidth', 'bossHealthHudTop',
    'bossHealthWidthRatio', 'bossHealthBarHeight', 'giantDiscButtonTop',
    'unitPerspectiveFarY', 'unitPerspectiveNearY', 'unitPerspectiveFarScale',
    'unitPerspectiveNearScale', 'enemyAnchorLabelOffset', 'groundShadowWidthRatio',
    'groundShadowHeightRatio', 'groundShadowBottomRatio', 'projectileSpinDurationMs',
    'healthBarHeight', 'healthBarOutlineWidth', 'healthBarLowHue', 'healthBarHighHue',
    'healthBarSaturationPercent', 'healthBarLightnessPercent',
  ], { min: 0 });
  validateStringFields(config, path, [
    'groundShadowColor', 'healthBarOutlineColor', 'healthBarTrackColor',
  ]);
  validatePositiveNumberFields(config, path, [
    'projectileSpinDurationMs', 'unitPerspectiveFarScale', 'unitPerspectiveNearScale',
  ]);
  [
    'bossHealthWidthRatio',
    'unitPerspectiveFarY',
    'unitPerspectiveNearY',
    'groundShadowWidthRatio',
    'groundShadowHeightRatio',
    'groundShadowBottomRatio',
  ].forEach((field) => numberField(config, field, path, { min: 0, max: 1 }));
  ['healthBarLowHue', 'healthBarHighHue'].forEach((field) => (
    numberField(config, field, path, { min: 0, max: 360 })
  ));
  ['healthBarSaturationPercent', 'healthBarLightnessPercent'].forEach((field) => (
    numberField(config, field, path, { min: 0, max: 100 })
  ));
  if (
    (config.enemyMinimumRenderSize as number) > (config.enemyBaseRenderSize as number)
    || (config.enemyBaseRenderSize as number) > (config.enemyMaximumRenderSize as number)
  ) {
    throw new ConfigValidationError(
      `${path}.enemyBaseRenderSize`,
      'enemyMinimumRenderSize와 enemyMaximumRenderSize 사이여야 합니다.',
    );
  }
  if ((config.unitPerspectiveFarY as number) >= (config.unitPerspectiveNearY as number)) {
    throw new ConfigValidationError(
      `${path}.unitPerspectiveNearY`,
      'unitPerspectiveFarY보다 커야 합니다.',
    );
  }
}

export function validateBossSpecialAttack(value: unknown): void {
  const path = 'BOSS_SPECIAL_ATTACK';
  const config = record(value, path);
  validateNumberFields(config, path, [
    'intervalMs', 'windupMs', 'impactWidthMultiplier', 'impactHeightMultiplier',
    'impactTopRatio', 'impactLayerIndex', 'impactCenterX', 'impactCenterY',
    'impactOuterRadiusX', 'impactOuterRadiusY', 'impactInnerRadiusX', 'impactInnerRadiusY',
    'impactStartScale', 'impactEndScale', 'impactStrokeWidth', 'impactGlowStrokeMultiplier',
    'impactCrackStrokeWidth', 'screenFlashMaximumOpacity', 'screenShakePixels',
    'screenShakeCycles', 'projectileScale', 'projectileGlowRadius',
  ]);
  validateStringFields(config, path, [
    'impactViewBox', 'impactFillColor', 'impactRingColor', 'impactGlowColor',
    'impactCrackColor', 'dustPrimaryColor', 'dustSecondaryColor', 'screenFlashColor',
    'projectileBorderColor', 'projectileBackgroundColor', 'projectileTrailColor',
    'projectileGlowColor',
  ]);
  validatePositiveNumberFields(config, path, ['intervalMs', 'windupMs']);
  [
    'impactTopRatio', 'screenFlashMaximumOpacity',
  ].forEach((field) => numberField(config, field, path, { min: 0, max: 1 }));
  validatePositiveNumberFields(config, path, [
    'impactOuterRadiusX', 'impactOuterRadiusY', 'impactInnerRadiusX', 'impactInnerRadiusY',
    'impactStartScale', 'impactEndScale', 'projectileScale',
  ]);
  if ((config.windupMs as number) >= (config.intervalMs as number)) {
    throw new ConfigValidationError(`${path}.windupMs`, 'intervalMs보다 작아야 합니다.');
  }
  if (
    (config.impactInnerRadiusX as number) > (config.impactOuterRadiusX as number)
    || (config.impactInnerRadiusY as number) > (config.impactOuterRadiusY as number)
  ) {
    throw new ConfigValidationError(
      `${path}.impactInnerRadiusX`,
      '안쪽 반지름은 바깥쪽 반지름 이하여야 합니다.',
    );
  }
  array(config.impactCrackPaths, `${path}.impactCrackPaths`).forEach((item, index) => {
    stringValue(item, `${path}.impactCrackPaths[${index}]`);
  });
  array(config.dustParticles, `${path}.dustParticles`).forEach((item, index) => {
    const itemPath = `${path}.dustParticles[${index}]`;
    validateNumberFields(record(item, itemPath), itemPath, ['x', 'y', 'radius']);
  });
}

export function validateGiantDisc(value: unknown): void {
  const path = 'GIANT_DISC';
  const config = record(value, path);
  validateNumberFields(config, path, [
    'damageMultiplier', 'speedMultiplier', 'attackRadius', 'renderWidthRatio',
    'effectPulseDurationMs', 'launchNoticeMs', 'effectPulseScale', 'effectRingBorderWidth',
  ], { min: 0 });
  validateStringFields(config, path, [
    'effectOuterColor', 'effectInnerColor', 'effectGlowColor', 'effectOuterFillColor',
    'effectInnerFillColor', 'effectTextShadowColor', 'buttonBackgroundColor',
    'buttonDisabledColor', 'buttonBorderColor', 'buttonCountColor',
  ]);
  validatePositiveNumberFields(config, path, ['effectPulseDurationMs']);
  numberField(config, 'renderWidthRatio', path, { min: 0, max: 1 });
}
