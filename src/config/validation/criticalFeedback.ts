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

export function validateCriticalEffect(
  config: UnknownRecord,
  rootPath: string,
  gainDurationMs: number,
  sparkleDelayMs: number,
): void {
  const path = `${rootPath}.criticalEffect`;
  const effect = record(config.criticalEffect, path);
  validateStringFields(effect, path, ['flashColor']);
  ['slashGradientColors', 'lightningColors', 'fragmentColors']
    .forEach((field) => validateColorArray(
      effect,
      path,
      field,
      field === 'slashGradientColors' ? 2 : 1,
    ));

  const integerFields = [
    'durationMs', 'compactDurationMs', 'sizePixels', 'maximumConcurrentFullEffects',
    'maximumConcurrentCompactEffects', 'slashCount', 'compactSlashCount',
    'slashLengthPixels', 'slashWidthPixels', 'lightningBranchCount',
    'compactLightningBranchCount', 'lightningSegmentCount', 'lightningSegmentLengthPixels',
    'lightningSegmentWidthPixels', 'lightningStartDistancePixels',
    'lightningZigzagOffsetPixels', 'fragmentCount', 'fragmentStartDistancePixels',
    'fragmentEndDistancePixels', 'fragmentMinimumSizePixels', 'fragmentMaximumSizePixels',
  ];
  validateNumberFields(effect, path, [
    ...integerFields, 'flashMaximumOpacity', 'compactFlashMaximumOpacity',
    'flashStartScale', 'flashEndScale', 'flashRotationDegrees', 'impactPeakProgress',
    'impactFadeStartProgress', 'slashAngleOffsetDegrees', 'slashAngleStepDegrees',
    'slashStartScale', 'slashPeakScale', 'slashEndScale', 'slashFadeStartProgress',
    'lightningAngleOffsetDegrees', 'lightningSegmentTurnDegrees',
    'lightningRevealProgress', 'lightningBranchStaggerProgress',
    'lightningSegmentStaggerProgress', 'lightningFadeStartProgress',
    'lightningSegmentStartScale', 'fragmentStartProgress', 'fragmentRevealProgress',
    'fragmentFadeStartProgress', 'fragmentRotationTurns', 'fragmentAngleOffsetDegrees',
    'compactScale',
  ], { min: 0 });
  integerFields.forEach((field) => numberField(effect, field, path, { integer: true, min: 1 }));
  numberField(effect, 'maximumConcurrentFullEffects', path, { integer: true, min: 1, max: 3 });
  numberField(effect, 'maximumConcurrentCompactEffects', path, { integer: true, min: 1, max: 4 });
  numberField(effect, 'slashCount', path, { integer: true, min: 1, max: 4 });
  numberField(effect, 'compactSlashCount', path, { integer: true, min: 1, max: 3 });
  numberField(effect, 'lightningBranchCount', path, { integer: true, min: 1, max: 12 });
  numberField(effect, 'compactLightningBranchCount', path, { integer: true, min: 1, max: 8 });
  numberField(effect, 'lightningSegmentCount', path, { integer: true, min: 1, max: 6 });
  numberField(effect, 'fragmentCount', path, { integer: true, min: 1, max: 20 });
  ['flashMaximumOpacity', 'compactFlashMaximumOpacity'].forEach((field) => (
    numberField(effect, field, path, { min: 0, max: 1 })
  ));
  [
    'impactPeakProgress', 'impactFadeStartProgress', 'slashFadeStartProgress',
    'lightningRevealProgress', 'lightningBranchStaggerProgress',
    'lightningSegmentStaggerProgress', 'lightningFadeStartProgress',
    'lightningSegmentStartScale', 'fragmentStartProgress', 'fragmentRevealProgress',
    'fragmentFadeStartProgress',
  ].forEach((field) => numberField(effect, field, path, { min: 0, max: 1 }));

  assertLess(effect, path, 'impactPeakProgress', 'impactFadeStartProgress');
  assertLess(effect, path, 'impactPeakProgress', 'slashFadeStartProgress');
  assertLess(effect, path, 'lightningRevealProgress', 'lightningFadeStartProgress');
  assertAscending(effect, path, [
    'fragmentStartProgress', 'fragmentRevealProgress', 'fragmentFadeStartProgress',
  ]);
  assertLess(effect, path, 'flashStartScale', 'flashEndScale');
  assertLess(effect, path, 'fragmentStartDistancePixels', 'fragmentEndDistancePixels');
  assertLess(effect, path, 'fragmentMinimumSizePixels', 'fragmentMaximumSizePixels');
  if ((effect.compactSlashCount as number) > (effect.slashCount as number)) {
    throw new ConfigValidationError(`${path}.compactSlashCount`, 'slashCount 이하여야 합니다.');
  }
  if ((effect.compactLightningBranchCount as number) > (effect.lightningBranchCount as number)) {
    throw new ConfigValidationError(
      `${path}.compactLightningBranchCount`,
      'lightningBranchCount 이하여야 합니다.',
    );
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
  if ((effect.durationMs as number) > gainDurationMs) {
    throw new ConfigValidationError(`${path}.durationMs`, 'floatingGain.durationMs 이하여야 합니다.');
  }
  if ((effect.compactDurationMs as number) > gainDurationMs) {
    throw new ConfigValidationError(
      `${path}.compactDurationMs`,
      'floatingGain.durationMs 이하여야 합니다.',
    );
  }
  if (sparkleDelayMs >= (effect.durationMs as number)) {
    throw new ConfigValidationError(
      `${rootPath}.audio.criticalSparkleDelayMs`,
      '크리티컬 효과 지속 시간보다 짧아야 합니다.',
    );
  }
}
