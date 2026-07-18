import {
  ConfigValidationError,
  array,
  numberField,
  numberValue,
  record,
  validateNumberFields,
  validateStringFields,
} from './primitives';

export function validateCookieFeedback(value: unknown): void {
  const path = 'COOKIE_FEEDBACK';
  const config = record(value, path);
  const audioPath = `${path}.audio`;
  const audio = record(config.audio, audioPath);
  validateNumberFields(audio, audioPath, [
    'minimumClickIntervalMs', 'minimumFullCriticalIntervalMs',
    'criticalLayerDurationMs', 'criticalSparkleDelayMs', 'criticalImpactVolumeMultiplier',
    'criticalSparkleVolumeMultiplier',
  ], { min: 0 });
  [
    'minimumClickIntervalMs', 'minimumFullCriticalIntervalMs',
    'criticalLayerDurationMs', 'criticalSparkleDelayMs',
  ].forEach((field) => numberField(audio, field, audioPath, { integer: true, min: 0 }));
  [
    'criticalImpactVolumeMultiplier', 'criticalSparkleVolumeMultiplier',
  ].forEach((field) => numberField(audio, field, audioPath, { min: 0, max: 1 }));
  const playbackRates = array(audio.voicePlaybackRates, `${audioPath}.voicePlaybackRates`)
    .map((item, index) => numberValue(
      item,
      `${audioPath}.voicePlaybackRates[${index}]`,
      { min: 0.1, max: 2 },
    ));
  const voiceVolumes = array(
    audio.voiceVolumeMultipliers,
    `${audioPath}.voiceVolumeMultipliers`,
  ).map((item, index) => numberValue(
    item,
    `${audioPath}.voiceVolumeMultipliers[${index}]`,
    { min: 0, max: 1 },
  ));
  if (playbackRates.length !== voiceVolumes.length) {
    throw new ConfigValidationError(
      `${audioPath}.voiceVolumeMultipliers`,
      'voicePlaybackRates와 같은 개수여야 합니다.',
    );
  }
  if (playbackRates.length !== 3) {
    throw new ConfigValidationError(
      `${audioPath}.voicePlaybackRates`,
      '동시 재생 풀과 같은 3개여야 합니다.',
    );
  }
  if (
    (audio.minimumFullCriticalIntervalMs as number)
    < (audio.criticalLayerDurationMs as number)
  ) {
    throw new ConfigValidationError(
      `${audioPath}.minimumFullCriticalIntervalMs`,
      'criticalLayerDurationMs 이상이어야 합니다.',
    );
  }

  const gainPath = `${path}.floatingGain`;
  const gain = record(config.floatingGain, gainPath);
  validateNumberFields(gain, gainPath, [
    'durationMs', 'maximumConcurrent', 'holdUntilProgress', 'risePixels', 'startScale',
    'peakAtProgress', 'peakScale', 'endScale',
  ], { min: 0 });
  numberField(gain, 'durationMs', gainPath, { integer: true, min: 1 });
  numberField(gain, 'maximumConcurrent', gainPath, { integer: true, min: 1, max: 8 });
  ['holdUntilProgress', 'peakAtProgress'].forEach((field) => (
    numberField(gain, field, gainPath, { min: 0, max: 1 })
  ));
  if ((gain.peakAtProgress as number) >= (gain.holdUntilProgress as number)) {
    throw new ConfigValidationError(
      `${gainPath}.peakAtProgress`,
      'holdUntilProgress보다 작아야 합니다.',
    );
  }

  const effectPath = `${path}.criticalEffect`;
  const effect = record(config.criticalEffect, effectPath);
  validateStringFields(effect, effectPath, [
    'flashColor', 'coreColorStart', 'coreColorEnd', 'firstRingColor',
    'secondRingColor', 'fragmentColor', 'fragmentEdgeColor', 'fragmentChipColor',
    'sparkleColor', 'sparkleHighlightColor',
  ]);
  validateNumberFields(effect, effectPath, [
    'durationMs', 'compactDurationMs', 'sizePixels',
    'maximumConcurrentFullEffects', 'maximumConcurrentCompactEffects',
    'flashMaximumOpacity', 'flashStartScale', 'flashEndScale', 'coreSizeRatio',
    'coreStartScale', 'corePeakScale', 'coreEndScale', 'coreBorderWidth', 'corePeakProgress',
    'coreFadeStartProgress', 'firstRingStartScale', 'firstRingEndScale',
    'firstRingBorderWidth', 'secondRingStartProgress', 'secondRingStartScale',
    'secondRingEndScale', 'secondRingBorderWidth', 'ringFadeStartProgress',
    'fragmentCount', 'fragmentStartProgress', 'fragmentRevealProgress',
    'fragmentFadeStartProgress', 'fragmentStartDistancePixels',
    'fragmentEndDistancePixels', 'fragmentMinimumSizePixels',
    'fragmentMaximumSizePixels', 'fragmentBorderWidth', 'fragmentCornerRadiusRatio',
    'fragmentChipSizeRatio', 'fragmentRotationTurns',
    'fragmentAngleOffsetDegrees', 'sparkleCount', 'compactSparkleCount',
    'sparkleStartProgress', 'sparkleStaggerProgress', 'sparkleFadeStartProgress',
    'sparkleStartDistancePixels', 'sparkleEndDistancePixels', 'sparkleSizePixels',
    'sparkleThicknessRatio',
    'sparkleRotationTurns', 'sparkleAngleOffsetDegrees', 'compactScale',
  ], { min: 0 });
  [
    'durationMs', 'compactDurationMs', 'sizePixels', 'maximumConcurrentFullEffects',
    'maximumConcurrentCompactEffects', 'fragmentCount', 'fragmentStartDistancePixels',
    'fragmentEndDistancePixels', 'fragmentMinimumSizePixels',
    'fragmentMaximumSizePixels', 'sparkleCount', 'compactSparkleCount',
    'sparkleStartDistancePixels', 'sparkleEndDistancePixels', 'sparkleSizePixels',
  ].forEach((field) => numberField(effect, field, effectPath, { integer: true, min: 1 }));
  numberField(effect, 'maximumConcurrentFullEffects', effectPath, { integer: true, min: 1, max: 3 });
  numberField(effect, 'maximumConcurrentCompactEffects', effectPath, { integer: true, min: 1, max: 4 });
  numberField(effect, 'fragmentCount', effectPath, { integer: true, min: 1, max: 16 });
  numberField(effect, 'sparkleCount', effectPath, { integer: true, min: 1, max: 8 });
  numberField(effect, 'compactSparkleCount', effectPath, { integer: true, min: 1, max: 4 });
  numberField(effect, 'flashMaximumOpacity', effectPath, { min: 0, max: 1 });
  numberField(effect, 'coreSizeRatio', effectPath, { min: 0, max: 1 });
  ['fragmentCornerRadiusRatio', 'fragmentChipSizeRatio', 'sparkleThicknessRatio']
    .forEach((field) => numberField(effect, field, effectPath, { min: 0, max: 1 }));
  [
    'corePeakProgress', 'coreFadeStartProgress', 'secondRingStartProgress',
    'ringFadeStartProgress', 'fragmentStartProgress', 'fragmentRevealProgress',
    'fragmentFadeStartProgress', 'sparkleStartProgress', 'sparkleStaggerProgress',
    'sparkleFadeStartProgress',
  ].forEach((field) => numberField(effect, field, effectPath, { min: 0, max: 1 }));
  const orderedPhases: Array<[string, string]> = [
    ['corePeakProgress', 'coreFadeStartProgress'],
    ['fragmentStartProgress', 'fragmentRevealProgress'],
    ['fragmentRevealProgress', 'fragmentFadeStartProgress'],
    ['sparkleStartProgress', 'sparkleFadeStartProgress'],
  ];
  orderedPhases.forEach(([start, end]) => {
    if ((effect[start] as number) >= (effect[end] as number)) {
      throw new ConfigValidationError(`${effectPath}.${end}`, `${start}보다 커야 합니다.`);
    }
  });
  if ((effect.secondRingStartProgress as number) >= (effect.ringFadeStartProgress as number)) {
    throw new ConfigValidationError(
      `${effectPath}.ringFadeStartProgress`,
      'secondRingStartProgress보다 커야 합니다.',
    );
  }
  const finalSparkleStart = (effect.sparkleStartProgress as number)
    + ((effect.sparkleCount as number) - 1) * (effect.sparkleStaggerProgress as number);
  if (finalSparkleStart >= (effect.sparkleFadeStartProgress as number)) {
    throw new ConfigValidationError(
      `${effectPath}.sparkleFadeStartProgress`,
      '마지막 스파클 시작 시점보다 커야 합니다.',
    );
  }
  [
    ['flashStartScale', 'flashEndScale'],
    ['firstRingStartScale', 'firstRingEndScale'],
    ['secondRingStartScale', 'secondRingEndScale'],
    ['fragmentStartDistancePixels', 'fragmentEndDistancePixels'],
    ['fragmentMinimumSizePixels', 'fragmentMaximumSizePixels'],
    ['sparkleStartDistancePixels', 'sparkleEndDistancePixels'],
  ].forEach(([start, end]) => {
    if ((effect[start] as number) >= (effect[end] as number)) {
      throw new ConfigValidationError(`${effectPath}.${end}`, `${start}보다 커야 합니다.`);
    }
  });
  if ((effect.durationMs as number) > (gain.durationMs as number)) {
    throw new ConfigValidationError(
      `${effectPath}.durationMs`,
      'floatingGain.durationMs 이하여야 합니다.',
    );
  }
  if ((effect.compactDurationMs as number) > (gain.durationMs as number)) {
    throw new ConfigValidationError(
      `${effectPath}.compactDurationMs`,
      'floatingGain.durationMs 이하여야 합니다.',
    );
  }
  if ((audio.criticalSparkleDelayMs as number) >= (effect.durationMs as number)) {
    throw new ConfigValidationError(
      `${audioPath}.criticalSparkleDelayMs`,
      '크리티컬 효과 지속 시간보다 짧아야 합니다.',
    );
  }
}
