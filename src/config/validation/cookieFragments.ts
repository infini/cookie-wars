import {
  ConfigValidationError,
  UnknownRecord,
  assertUnique,
  numberField,
  record,
  validateIdTable,
  validateNumberFields,
  validatePositiveNumberFields,
  validateStringFields,
} from './primitives';
import { assertAscending, validateColorArray } from './feedbackEffectPrimitives';

function validateFragmentTypes(config: UnknownRecord, path: string): void {
  const types = validateIdTable(config.types, `${path}.types`);
  const expectedIds = ['magma', 'electric'];
  if (types.length !== expectedIds.length || types.some((item, index) => item.id !== expectedIds[index])) {
    throw new ConfigValidationError(`${path}.types`, 'magma, electric 순서의 두 조각이어야 합니다.');
  }
  types.forEach((fragment, index) => {
    const itemPath = `${path}.types[${index}]`;
    validateStringFields(fragment, itemPath, [
      'upgradeId', 'name', 'imageKey', 'accentColor', 'glowColor', 'labelColor',
    ]);
    validatePositiveNumberFields(fragment, itemPath, [
      'baseRewardMultiplier', 'rewardMultiplierIncreasePerLevel', 'maximumChanceUnits',
    ], { integer: true });
    numberField(fragment, 'feedbackPowerRank', itemPath, { integer: true, min: 1, max: 4 });
    numberField(fragment, 'displayMaximumFractionDigits', itemPath, {
      integer: true,
      min: 0,
      max: 4,
    });
    if ((fragment.maximumChanceUnits as number) > (config.probabilityScale as number)) {
      throw new ConfigValidationError(
        `${itemPath}.maximumChanceUnits`,
        'probabilityScale 이하여야 합니다.',
      );
    }
  });
  assertUnique(types.map((item) => item.upgradeId as string), `${path}.types.upgradeId`);
  assertUnique(types.map((item) => item.imageKey as string), `${path}.types.imageKey`);
  const maximumCombinedChance = types.reduce(
    (sum, item) => sum + (item.maximumChanceUnits as number),
    0,
  );
  if (maximumCombinedChance > (config.probabilityScale as number)) {
    throw new ConfigValidationError(
      `${path}.types.maximumChanceUnits`,
      '조각 최대 확률의 합은 100% 이하여야 합니다.',
    );
  }
}

function validateSpawnEffect(config: UnknownRecord, path: string): void {
  const effectPath = `${path}.spawnEffect`;
  const effect = record(config.spawnEffect, effectPath);
  const integerFields = [
    'spriteSizePixels', 'hitSlopPixels', 'targetOffsetXPixels', 'targetOffsetYPixels',
    'launchRisePixels', 'launchDurationMs', 'startRotationDegrees', 'endRotationDegrees',
    'idlePulseDurationMs', 'crumbCount', 'crumbMinimumSizePixels',
    'crumbMaximumSizePixels', 'crumbStartDistancePixels', 'crumbEndDistancePixels',
    'crumbFallPixels', 'crumbDurationMs', 'timerWidthPixels', 'timerHeightPixels',
    'timerBottomOffsetPixels',
  ];
  validateNumberFields(effect, effectPath, [
    ...integerFields, 'anchorTopRatio', 'startScale', 'peakScale', 'settledScale',
    'peakProgress', 'idlePulseScale', 'crumbHorizontalSpreadRatio',
    'crumbVerticalSpreadRatio', 'crumbRotationTurns', 'timerWarningRatio',
    'auraSizeRatio', 'auraCornerRadiusRatio', 'auraMaximumOpacity',
  ]);
  integerFields.forEach((field) => numberField(effect, field, effectPath, {
    integer: true,
    min: field === 'startRotationDegrees' || field === 'endRotationDegrees' ? undefined : 0,
  }));
  [
    'anchorTopRatio', 'peakProgress', 'crumbHorizontalSpreadRatio',
    'crumbVerticalSpreadRatio', 'timerWarningRatio', 'auraCornerRadiusRatio',
    'auraMaximumOpacity',
  ]
    .forEach((field) => numberField(effect, field, effectPath, { min: 0, max: 1 }));
  validatePositiveNumberFields(effect, effectPath, [
    'spriteSizePixels', 'launchDurationMs', 'startScale', 'peakScale', 'settledScale',
    'idlePulseScale', 'crumbCount', 'crumbMaximumSizePixels', 'crumbDurationMs',
    'timerWidthPixels', 'timerHeightPixels', 'auraSizeRatio',
  ]);
  validateStringFields(effect, effectPath, [
    'normalTimerColor', 'warningTimerColor', 'timerTrackColor',
  ]);
  assertAscending(effect, effectPath, ['crumbMinimumSizePixels', 'crumbMaximumSizePixels']);
  assertAscending(effect, effectPath, ['crumbStartDistancePixels', 'crumbEndDistancePixels']);
}

function validateClaimEffect(config: UnknownRecord, path: string): void {
  const effectPath = `${path}.claimEffect`;
  const effect = record(config.claimEffect, effectPath);
  const integerFields = [
    'magmaDurationMs', 'electricDurationMs', 'sizePixels', 'magmaStreamCount',
    'magmaEmberCount', 'magmaStreamMinimumWidthPixels',
    'magmaStreamMaximumWidthPixels', 'magmaEmberMinimumSizePixels',
    'magmaEmberMaximumSizePixels', 'magmaEmberStartDistancePixels',
    'electricBoltCount', 'electricSegmentCount',
    'electricSegmentLengthPixels', 'electricSegmentWidthPixels',
    'electricTurnDegrees', 'electricZigzagPixels',
    'electricShardCount', 'electricShardMinimumSizePixels',
    'electricShardMaximumSizePixels', 'electricShardStartDistancePixels',
    'electricShardEndDistancePixels', 'rewardFontSize', 'rewardShadowRadius',
    'magmaShakeDistancePixels',
    'electricShakeDistancePixels', 'magmaStreamWidthSequenceStep',
    'magmaEmberSizeSequenceStep', 'electricColumnWidthMultiplier',
  ];
  validateNumberFields(effect, effectPath, [
    ...integerFields, 'screenWidthRatio', 'screenHeightRatio',
    'flashMaximumOpacity', 'flashStartScale', 'flashEndScale',
    'flashPeakProgress', 'flashFadeProgress', 'magmaStreamLengthRatio',
    'magmaFlowDistanceRatio', 'magmaHorizontalInsetRatio',
    'magmaStreamRevealProgress', 'magmaStreamStaggerProgress',
    'magmaEmberFallDistanceRatio', 'magmaEmberRotationTurns',
    'magmaEmberAngleOffsetDegrees', 'magmaEmberRevealProgress',
    'magmaVolcanoSizeRatio', 'magmaVolcanoLeftRatio', 'magmaVolcanoTopRatio',
    'magmaVolcanoStartOffsetYRatio', 'magmaVolcanoEndOffsetYRatio',
    'magmaVolcanoPeakScale', 'magmaVolcanoSettleProgress',
    'magmaEmberHorizontalInsetRatio',
    'electricHorizontalInsetRatio', 'electricTopRatio', 'electricRevealProgress',
    'electricBoltStaggerProgress', 'electricSegmentStaggerProgress',
    'electricSegmentStartScale', 'electricSegmentEndScale',
    'electricSegmentSpacingRatio', 'electricColumnHeightRatio',
    'electricColumnRevealProgress', 'electricColumnMaximumOpacity',
    'electricColumnFadeOpacity', 'electricCoreWidthRatio',
    'electricShardRotationTurns',
    'electricShardAngleOffsetDegrees', 'electricShardRevealProgress',
    'rewardTopRatio', 'rewardPeakScale', 'rewardStartScale',
    'rewardEndScale', 'fadeStartProgress',
  ], { min: 0 });
  integerFields.forEach((field) => numberField(effect, field, effectPath, {
    integer: true,
    min: 1,
  }));
  [
    'flashMaximumOpacity', 'flashPeakProgress', 'flashFadeProgress',
    'rewardTopRatio', 'fadeStartProgress', 'magmaStreamLengthRatio',
    'magmaFlowDistanceRatio', 'magmaHorizontalInsetRatio',
    'magmaStreamRevealProgress', 'magmaStreamStaggerProgress',
    'magmaEmberFallDistanceRatio', 'electricHorizontalInsetRatio',
    'electricTopRatio', 'electricRevealProgress',
    'electricBoltStaggerProgress', 'electricSegmentStaggerProgress',
    'electricSegmentStartScale', 'magmaEmberRevealProgress',
    'electricShardRevealProgress', 'magmaVolcanoSizeRatio',
    'magmaVolcanoLeftRatio', 'magmaVolcanoTopRatio',
    'magmaVolcanoStartOffsetYRatio', 'magmaVolcanoEndOffsetYRatio',
    'magmaVolcanoSettleProgress', 'magmaEmberHorizontalInsetRatio',
    'electricSegmentEndScale', 'electricSegmentSpacingRatio',
    'electricColumnHeightRatio', 'electricColumnRevealProgress',
    'electricColumnMaximumOpacity', 'electricColumnFadeOpacity',
    'electricCoreWidthRatio',
  ].forEach((field) => numberField(effect, field, effectPath, { min: 0, max: 1 }));
  ['screenWidthRatio', 'screenHeightRatio'].forEach((field) => numberField(
    effect,
    field,
    effectPath,
    { min: 0.1, max: 2 },
  ));
  assertAscending(effect, effectPath, ['flashPeakProgress', 'flashFadeProgress']);
  assertAscending(effect, effectPath, ['flashPeakProgress', 'magmaEmberRevealProgress']);
  assertAscending(effect, effectPath, ['electricRevealProgress', 'electricShardRevealProgress']);
  assertAscending(effect, effectPath, ['flashStartScale', 'flashEndScale']);
  assertAscending(effect, effectPath, ['rewardStartScale', 'rewardPeakScale']);
  if ((effect.flashFadeProgress as number) >= (effect.fadeStartProgress as number)) {
    throw new ConfigValidationError(
      `${effectPath}.fadeStartProgress`,
      'flashFadeProgress보다 커야 합니다.',
    );
  }
  if ((effect.magmaEmberRevealProgress as number) >= (effect.fadeStartProgress as number)) {
    throw new ConfigValidationError(
      `${effectPath}.magmaEmberRevealProgress`,
      'fadeStartProgress보다 작아야 합니다.',
    );
  }
  const finalStreamStart = (effect.magmaStreamRevealProgress as number)
    + ((effect.magmaStreamCount as number) - 1)
      * (effect.magmaStreamStaggerProgress as number);
  if (finalStreamStart >= (effect.fadeStartProgress as number)) {
    throw new ConfigValidationError(
      `${effectPath}.magmaStreamStaggerProgress`,
      '마지막 용암 줄기도 fadeStartProgress 전에 나타나야 합니다.',
    );
  }
  const finalLightningStart = (effect.electricRevealProgress as number)
    + ((effect.electricBoltCount as number) - 1)
      * (effect.electricBoltStaggerProgress as number)
    + ((effect.electricSegmentCount as number) - 1)
      * (effect.electricSegmentStaggerProgress as number);
  if (finalLightningStart >= (effect.fadeStartProgress as number)) {
    throw new ConfigValidationError(
      `${effectPath}.electricSegmentStaggerProgress`,
      '마지막 번개도 fadeStartProgress 전에 나타나야 합니다.',
    );
  }
  if ((effect.electricShardRevealProgress as number) >= (effect.fadeStartProgress as number)) {
    throw new ConfigValidationError(
      `${effectPath}.electricShardRevealProgress`,
      'fadeStartProgress보다 작아야 합니다.',
    );
  }
  validateColorArray(effect, effectPath, 'magmaColors', 2);
  validateColorArray(effect, effectPath, 'electricColors', 2);
  validateStringFields(effect, effectPath, ['rewardShadowColor']);
  assertAscending(effect, effectPath, [
    'magmaStreamMinimumWidthPixels', 'magmaStreamMaximumWidthPixels',
  ]);
  assertAscending(effect, effectPath, [
    'magmaEmberMinimumSizePixels', 'magmaEmberMaximumSizePixels',
  ]);
  assertAscending(effect, effectPath, [
    'electricShardMinimumSizePixels', 'electricShardMaximumSizePixels',
  ]);
  assertAscending(effect, effectPath, [
    'electricShardStartDistancePixels', 'electricShardEndDistancePixels',
  ]);
}

function validateAudio(config: UnknownRecord, path: string): void {
  const audioPath = `${path}.audio`;
  const audio = record(config.audio, audioPath);
  [
    'magmaVolumeMultiplier', 'electricThunderVolumeMultiplier',
  ].forEach((field) => numberField(audio, field, audioPath, { min: 0, max: 1 }));
  numberField(audio, 'magmaRepeatCount', audioPath, { integer: true, min: 1, max: 2 });
  numberField(audio, 'magmaRepeatIntervalMs', audioPath, { integer: true, min: 1 });
  numberField(audio, 'electricThunderDelayMs', audioPath, { integer: true, min: 0 });
  numberField(audio, 'electricThunderRepeatCount', audioPath, {
    integer: true,
    min: 1,
    max: 5,
  });
  numberField(audio, 'electricThunderRepeatIntervalMs', audioPath, {
    integer: true,
    min: 1,
  });
}

export function validateCookieFragments(value: unknown): UnknownRecord {
  const path = 'COOKIE_FRAGMENTS';
  const config = record(value, path);
  validatePositiveNumberFields(config, path, ['probabilityScale', 'lifetimeMs'], {
    integer: true,
  });
  validateFragmentTypes(config, path);
  validateSpawnEffect(config, path);
  validateClaimEffect(config, path);
  validateAudio(config, path);
  return config;
}
