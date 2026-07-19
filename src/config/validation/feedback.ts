import {
  ConfigValidationError,
  UnknownRecord,
  array,
  numberField,
  numberValue,
  record,
  stringValue,
  validateNumberFields,
} from './primitives';
import { assertLess } from './feedbackEffectPrimitives';

function validateCookieAudio(config: UnknownRecord, path: string): UnknownRecord {
  const audioPath = `${path}.audio`;
  const audio = record(config.audio, audioPath);
  validateNumberFields(audio, audioPath, [
    'minimumClickIntervalMs', 'minimumFullCriticalIntervalMs',
    'criticalLayerDurationMs', 'criticalSparkleDelayMs', 'criticalImpactVolumeMultiplier',
    'criticalSparkleVolumeMultiplier', 'minimumFullSuperCriticalIntervalMs',
    'superCriticalImpactVolumeMultiplier', 'superCriticalShockwaveVolumeMultiplier',
    'superCriticalShockwaveDelayMs', 'superCriticalLayerDurationMs',
  ], { min: 0 });
  [
    'minimumClickIntervalMs', 'minimumFullCriticalIntervalMs',
    'criticalLayerDurationMs', 'criticalSparkleDelayMs',
    'minimumFullSuperCriticalIntervalMs', 'superCriticalShockwaveDelayMs',
    'superCriticalLayerDurationMs',
  ].forEach((field) => numberField(audio, field, audioPath, { integer: true, min: 0 }));
  [
    'criticalImpactVolumeMultiplier', 'criticalSparkleVolumeMultiplier',
    'superCriticalImpactVolumeMultiplier', 'superCriticalShockwaveVolumeMultiplier',
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
  if (playbackRates.length !== voiceVolumes.length || playbackRates.length !== 3) {
    throw new ConfigValidationError(
      `${audioPath}.voiceVolumeMultipliers`,
      '재생 속도와 음량은 동시 재생 풀과 같은 3개여야 합니다.',
    );
  }
  if ((audio.minimumFullCriticalIntervalMs as number) < (audio.criticalLayerDurationMs as number)) {
    throw new ConfigValidationError(
      `${audioPath}.minimumFullCriticalIntervalMs`,
      'criticalLayerDurationMs 이상이어야 합니다.',
    );
  }
  if ((audio.criticalSparkleDelayMs as number) >= (audio.criticalLayerDurationMs as number)) {
    throw new ConfigValidationError(
      `${audioPath}.criticalSparkleDelayMs`,
      'criticalLayerDurationMs보다 짧아야 합니다.',
    );
  }
  if (
    (audio.minimumFullSuperCriticalIntervalMs as number)
    < (audio.superCriticalLayerDurationMs as number)
  ) {
    throw new ConfigValidationError(
      `${audioPath}.minimumFullSuperCriticalIntervalMs`,
      'superCriticalLayerDurationMs 이상이어야 합니다.',
    );
  }
  return audio;
}

function validateFloatingGain(config: UnknownRecord, path: string): UnknownRecord {
  const gainPath = `${path}.floatingGain`;
  const gain = record(config.floatingGain, gainPath);
  validateNumberFields(gain, gainPath, [
    'durationMs', 'maximumConcurrent', 'normalFontSize', 'criticalFontSize',
    'superCriticalFontSize', 'normalShadowRadius', 'criticalShadowRadius',
    'superCriticalShadowRadius', 'holdUntilProgress', 'risePixels', 'startScale',
    'peakAtProgress', 'peakScale', 'endScale',
  ], { min: 0 });
  ['normalColor', 'criticalColor', 'superCriticalColor', 'normalShadowColor',
    'criticalShadowColor', 'superCriticalShadowColor']
    .forEach((field) => stringValue(gain[field], `${gainPath}.${field}`));
  ['normalFontSize', 'criticalFontSize', 'superCriticalFontSize']
    .forEach((field) => numberField(gain, field, gainPath, { min: Number.EPSILON }));
  numberField(gain, 'durationMs', gainPath, { integer: true, min: 1 });
  numberField(gain, 'maximumConcurrent', gainPath, { integer: true, min: 1, max: 8 });
  ['holdUntilProgress', 'peakAtProgress'].forEach((field) => (
    numberField(gain, field, gainPath, { min: 0, max: 1 })
  ));
  assertLess(gain, gainPath, 'peakAtProgress', 'holdUntilProgress');
  return gain;
}

function validateSuperCriticalShake(config: UnknownRecord, path: string): void {
  const shakePath = `${path}.superCriticalShake`;
  const shake = record(config.superCriticalShake, shakePath);
  validateNumberFields(shake, shakePath, [
    'firstProgress', 'secondProgress', 'thirdProgress', 'endProgress',
    'distancePixels', 'returnRatio',
  ], { min: 0 });
  ['firstProgress', 'secondProgress', 'thirdProgress', 'endProgress', 'returnRatio']
    .forEach((field) => numberField(shake, field, shakePath, { min: 0, max: 1 }));
  numberField(shake, 'distancePixels', shakePath, { min: 1 });
  assertLess(shake, shakePath, 'firstProgress', 'secondProgress');
  assertLess(shake, shakePath, 'secondProgress', 'thirdProgress');
  assertLess(shake, shakePath, 'thirdProgress', 'endProgress');
}

export function validateCookieFeedback(value: unknown): UnknownRecord {
  const path = 'COOKIE_FEEDBACK';
  const config = record(value, path);
  validateCookieAudio(config, path);
  validateFloatingGain(config, path);
  validateSuperCriticalShake(config, path);
  return config;
}
