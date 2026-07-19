import {
  ConfigValidationError,
  UnknownRecord,
  numberField,
  record,
  validateNumberFields,
  validateStringFields,
} from './primitives';
import {
  assertAscending,
  assertLess,
  validateColorArray,
} from './feedbackEffectPrimitives';

export function validateSuperCriticalEffect(
  config: UnknownRecord,
  rootPath: string,
  gainDurationMs: number,
  shockwaveDelayMs: number,
): void {
  const path = `${rootPath}.superCriticalEffect`;
  const effect = record(config.superCriticalEffect, path);
  validateStringFields(effect, path, [
    'flashColor', 'labelColor', 'labelShadowColor', 'shockwaveColor',
  ]);
  [
    'columnGradientColors', 'slashGradientColors', 'ghostSlashColors',
    'lightningColors', 'shardColors', 'riftColors',
  ].forEach((field) => validateColorArray(
    effect,
    path,
    field,
    field.includes('Gradient') ? 2 : 1,
  ));

  const integerFields = [
    'durationMs', 'compactDurationMs', 'sizePixels', 'maximumConcurrentFullEffects',
    'maximumConcurrentCompactEffects', 'shakeDistancePixels', 'columnWidthPixels',
    'columnLengthPixels', 'slashCount', 'compactSlashCount', 'slashLengthPixels',
    'slashWidthPixels', 'ghostSlashOffsetPixels', 'lightningBranchCount',
    'compactLightningBranchCount', 'lightningSegmentCount', 'lightningSegmentLengthPixels',
    'lightningSegmentWidthPixels', 'lightningStartDistancePixels',
    'lightningZigzagOffsetPixels', 'shardCount', 'compactShardCount',
    'shardStartDistancePixels', 'shardEndDistancePixels', 'shardMinimumSizePixels',
    'shardMaximumSizePixels', 'labelFontSize', 'labelShadowRadius',
    'riftSegmentCount', 'riftSegmentLengthPixels', 'riftSegmentWidthPixels',
    'riftZigzagPixels', 'riftTurnDegrees', 'riftGlowWidthMultiplier',
    'emblemSizePixels', 'emblemRotationDegrees',
    'shockwaveCount', 'shockwaveSizePixels', 'shockwaveBorderWidthPixels',
  ];
  validateNumberFields(effect, path, [
    ...integerFields, 'flashMaximumOpacity', 'compactFlashMaximumOpacity',
    'flashStartScale', 'flashEndScale', 'flashRotationDegrees', 'impactPeakProgress',
    'impactFadeStartProgress', 'chargeEndProgress', 'secondaryImpactProgress',
    'shakeFirstProgress', 'shakeSecondProgress',
    'shakeThirdProgress', 'shakeEndProgress', 'shakeReturnRatio', 'columnStartScale',
    'columnPeakScale', 'columnEndScale', 'slashAngleOffsetDegrees',
    'slashAngleStepDegrees', 'slashStartScale', 'slashPeakScale', 'slashEndScale',
    'slashFadeStartProgress', 'slashRevealProgress', 'slashStaggerProgress',
    'lightningAngleOffsetDegrees',
    'lightningSegmentTurnDegrees', 'lightningRevealProgress',
    'lightningBranchStaggerProgress', 'lightningSegmentStaggerProgress',
    'lightningFadeStartProgress', 'lightningSegmentStartScale', 'shardStartProgress',
    'shardRevealProgress', 'shardFadeStartProgress', 'shardRotationTurns',
    'shardAngleOffsetDegrees', 'compactScale', 'labelTopRatio', 'labelStartScale',
    'labelPeakScale', 'labelEndScale', 'riftTopRatio',
    'riftHorizontalSpreadRatio', 'riftRevealProgress',
    'riftSegmentStaggerProgress', 'riftFadeStartProgress', 'riftStartScale',
    'riftEndScale', 'riftGlowMaximumOpacity', 'emblemTopRatio',
    'emblemStartScale', 'emblemPeakScale', 'emblemEndScale',
    'emblemFadeStartProgress', 'shockwaveStaggerProgress', 'shockwaveEndScale',
    'shockwaveCornerRadiusRatio', 'shockwaveRotationDegrees',
  ], { min: 0 });
  integerFields.forEach((field) => numberField(effect, field, path, { integer: true, min: 1 }));
  numberField(effect, 'maximumConcurrentFullEffects', path, { integer: true, min: 1, max: 2 });
  numberField(effect, 'maximumConcurrentCompactEffects', path, { integer: true, min: 1, max: 3 });
  numberField(effect, 'slashCount', path, { integer: true, min: 1, max: 5 });
  numberField(effect, 'compactSlashCount', path, { integer: true, min: 1, max: 4 });
  numberField(effect, 'lightningBranchCount', path, { integer: true, min: 1, max: 16 });
  numberField(effect, 'compactLightningBranchCount', path, { integer: true, min: 1, max: 10 });
  numberField(effect, 'lightningSegmentCount', path, { integer: true, min: 1, max: 8 });
  numberField(effect, 'shardCount', path, { integer: true, min: 1, max: 24 });
  numberField(effect, 'compactShardCount', path, { integer: true, min: 1, max: 16 });
  numberField(effect, 'riftSegmentCount', path, { integer: true, min: 1, max: 12 });
  numberField(effect, 'shockwaveCount', path, { integer: true, min: 1, max: 5 });
  [
    'flashMaximumOpacity', 'compactFlashMaximumOpacity', 'shakeReturnRatio',
    'labelTopRatio', 'riftTopRatio', 'riftHorizontalSpreadRatio',
    'riftGlowMaximumOpacity', 'emblemTopRatio', 'emblemFadeStartProgress',
  ]
    .forEach((field) => numberField(effect, field, path, { min: 0, max: 1 }));
  [
    'impactPeakProgress', 'impactFadeStartProgress', 'shakeFirstProgress',
    'chargeEndProgress', 'secondaryImpactProgress',
    'shakeSecondProgress', 'shakeThirdProgress', 'shakeEndProgress',
    'slashFadeStartProgress', 'slashRevealProgress', 'slashStaggerProgress',
    'lightningBranchStaggerProgress', 'lightningSegmentStaggerProgress',
    'lightningFadeStartProgress', 'lightningSegmentStartScale', 'shardStartProgress',
    'shardRevealProgress', 'shardFadeStartProgress',
    'riftRevealProgress', 'riftSegmentStaggerProgress', 'riftFadeStartProgress',
    'shockwaveStaggerProgress', 'shockwaveCornerRadiusRatio',
  ].forEach((field) => numberField(effect, field, path, { min: 0, max: 1 }));

  assertLess(effect, path, 'impactPeakProgress', 'impactFadeStartProgress');
  assertLess(effect, path, 'chargeEndProgress', 'impactPeakProgress');
  assertLess(effect, path, 'impactPeakProgress', 'secondaryImpactProgress');
  assertLess(effect, path, 'secondaryImpactProgress', 'impactFadeStartProgress');
  assertAscending(effect, path, [
    'shakeFirstProgress', 'shakeSecondProgress', 'shakeThirdProgress', 'shakeEndProgress',
  ]);
  assertLess(effect, path, 'impactPeakProgress', 'slashFadeStartProgress');
  assertLess(effect, path, 'lightningRevealProgress', 'lightningFadeStartProgress');
  assertAscending(effect, path, ['shardStartProgress', 'shardRevealProgress', 'shardFadeStartProgress']);
  assertLess(effect, path, 'flashStartScale', 'flashEndScale');
  assertLess(effect, path, 'columnStartScale', 'columnPeakScale');
  assertLess(effect, path, 'shardStartDistancePixels', 'shardEndDistancePixels');
  assertLess(effect, path, 'shardMinimumSizePixels', 'shardMaximumSizePixels');
  assertLess(effect, path, 'labelStartScale', 'labelPeakScale');
  assertLess(effect, path, 'riftRevealProgress', 'riftFadeStartProgress');
  assertLess(effect, path, 'riftStartScale', 'riftEndScale');
  assertLess(effect, path, 'emblemStartScale', 'emblemPeakScale');
  assertLess(effect, path, 'impactPeakProgress', 'emblemFadeStartProgress');
  if ((effect.compactSlashCount as number) > (effect.slashCount as number)) {
    throw new ConfigValidationError(`${path}.compactSlashCount`, 'slashCount 이하여야 합니다.');
  }
  if ((effect.compactLightningBranchCount as number) > (effect.lightningBranchCount as number)) {
    throw new ConfigValidationError(
      `${path}.compactLightningBranchCount`,
      'lightningBranchCount 이하여야 합니다.',
    );
  }
  if ((effect.compactShardCount as number) > (effect.shardCount as number)) {
    throw new ConfigValidationError(`${path}.compactShardCount`, 'shardCount 이하여야 합니다.');
  }
  const finalLightningStart = (effect.lightningRevealProgress as number)
    + ((effect.lightningBranchCount as number) - 1)
      * (effect.lightningBranchStaggerProgress as number)
    + ((effect.lightningSegmentCount as number) - 1)
      * (effect.lightningSegmentStaggerProgress as number);
  if (finalLightningStart >= (effect.lightningFadeStartProgress as number)) {
    throw new ConfigValidationError(
      `${path}.lightningFadeStartProgress`,
      '마지막 번개 조각 시작 시점보다 커야 합니다.',
    );
  }
  const finalRiftStart = (effect.riftRevealProgress as number)
    + ((effect.riftSegmentCount as number) - 1)
      * (effect.riftSegmentStaggerProgress as number);
  if (finalRiftStart >= (effect.riftFadeStartProgress as number)) {
    throw new ConfigValidationError(
      `${path}.riftSegmentStaggerProgress`,
      '마지막 천공 균열도 fade 전에 나타나야 합니다.',
    );
  }
  const finalSlashReveal = (effect.impactPeakProgress as number)
    + ((effect.slashCount as number) - 1) * (effect.slashStaggerProgress as number)
    + (effect.slashRevealProgress as number);
  if (finalSlashReveal >= (effect.slashFadeStartProgress as number)) {
    throw new ConfigValidationError(
      `${path}.slashStaggerProgress`,
      '마지막 참격이 fade 전에 펼쳐져야 합니다.',
    );
  }
  const finalShockwaveStart = (effect.impactPeakProgress as number)
    + ((effect.shockwaveCount as number) - 1)
      * (effect.shockwaveStaggerProgress as number);
  if (finalShockwaveStart >= (effect.impactFadeStartProgress as number)) {
    throw new ConfigValidationError(
      `${path}.shockwaveStaggerProgress`,
      '마지막 충격파가 impact fade 전에 시작해야 합니다.',
    );
  }
  if ((effect.durationMs as number) > gainDurationMs) {
    throw new ConfigValidationError(`${path}.durationMs`, 'floatingGain.durationMs 이하여야 합니다.');
  }
  if ((effect.compactDurationMs as number) > gainDurationMs) {
    throw new ConfigValidationError(
      `${path}.compactDurationMs`,
      'floatingGain.durationMs 이하여야 합니다.',
    );
  }
  if (shockwaveDelayMs >= (effect.durationMs as number)) {
    throw new ConfigValidationError(
      `${rootPath}.audio.superCriticalShockwaveDelayMs`,
      '슈퍼 크리티컬 효과 지속 시간보다 짧아야 합니다.',
    );
  }
}
