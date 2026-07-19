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
    'magmaDurationMs', 'electricDurationMs', 'sizePixels',
    'magmaFlashRotationDegrees', 'electricFlashRotationDegrees',
    'magmaEruptionFrameCount', 'magmaEruptionFrameIntervalMs',
    'electricBoltCount', 'electricBoltRotationDegrees',
    'rewardFontSize', 'rewardShadowRadius', 'magmaShakeDistancePixels',
    'electricShakeDistancePixels',
  ];
  validateNumberFields(effect, effectPath, [
    ...integerFields, 'screenWidthRatio', 'screenHeightRatio',
    'flashMaximumOpacity', 'flashStartScale', 'flashEndScale',
    'flashPeakProgress', 'flashFadeProgress',
    'magmaEruptionSizeRatio', 'magmaEruptionLeftRatio', 'magmaEruptionTopRatio',
    'magmaVolcanoSizeRatio', 'magmaVolcanoLeftRatio', 'magmaVolcanoTopRatio',
    'magmaVolcanoStartOffsetYRatio', 'magmaVolcanoEndOffsetYRatio',
    'magmaVolcanoPeakScale', 'magmaVolcanoSettleProgress',
    'electricHorizontalInsetRatio', 'electricTopRatio',
    'electricBoltWidthRatio', 'electricBoltHeightRatio', 'electricBoltStartScale',
    'electricRevealProgress', 'electricBoltStaggerProgress',
    'electricBoltVisibleProgress',
    'rewardTopRatio', 'rewardPeakScale', 'rewardStartScale',
    'rewardEndScale', 'fadeStartProgress',
  ], { min: 0 });
  integerFields.forEach((field) => numberField(effect, field, effectPath, {
    integer: true,
    min: field.endsWith('RotationDegrees') ? 0 : 1,
  }));
  [
    'flashMaximumOpacity', 'flashPeakProgress', 'flashFadeProgress',
    'rewardTopRatio', 'fadeStartProgress', 'magmaEruptionSizeRatio',
    'magmaEruptionLeftRatio', 'magmaEruptionTopRatio', 'magmaVolcanoSizeRatio',
    'magmaVolcanoLeftRatio', 'magmaVolcanoTopRatio',
    'magmaVolcanoStartOffsetYRatio', 'magmaVolcanoEndOffsetYRatio',
    'magmaVolcanoSettleProgress', 'electricHorizontalInsetRatio',
    'electricTopRatio', 'electricBoltWidthRatio', 'electricBoltHeightRatio',
    'electricBoltStartScale',
    'electricRevealProgress', 'electricBoltStaggerProgress',
    'electricBoltVisibleProgress',
  ].forEach((field) => numberField(effect, field, effectPath, { min: 0, max: 1 }));
  ['screenWidthRatio', 'screenHeightRatio'].forEach((field) => numberField(
    effect,
    field,
    effectPath,
    { min: 0.1, max: 2 },
  ));
  assertAscending(effect, effectPath, ['flashPeakProgress', 'flashFadeProgress']);
  assertAscending(effect, effectPath, ['flashStartScale', 'flashEndScale']);
  assertAscending(effect, effectPath, ['rewardStartScale', 'rewardPeakScale']);
  if ((effect.flashFadeProgress as number) >= (effect.fadeStartProgress as number)) {
    throw new ConfigValidationError(
      `${effectPath}.fadeStartProgress`,
      'flashFadeProgress보다 커야 합니다.',
    );
  }
  const finalLightningStart = (effect.electricRevealProgress as number)
    + ((effect.electricBoltCount as number) - 1)
      * (effect.electricBoltStaggerProgress as number);
  if (
    finalLightningStart + (effect.electricBoltVisibleProgress as number)
      >= (effect.fadeStartProgress as number)
  ) {
    throw new ConfigValidationError(
      `${effectPath}.electricBoltVisibleProgress`,
      '마지막 외부 번개가 fadeStartProgress 전에 끝나야 합니다.',
    );
  }
  if ((effect.magmaEruptionFrameCount as number) !== 16) {
    throw new ConfigValidationError(
      `${effectPath}.magmaEruptionFrameCount`,
      '외부 폭발 atlas의 16프레임과 같아야 합니다.',
    );
  }
  validateColorArray(effect, effectPath, 'magmaColors', 2);
  validateColorArray(effect, effectPath, 'electricColors', 2);
  validateStringFields(effect, effectPath, ['rewardShadowColor']);
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
