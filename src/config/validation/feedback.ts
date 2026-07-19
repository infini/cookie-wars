import {
  ConfigValidationError,
  UnknownRecord,
  array,
  numberField,
  numberValue,
  record,
  validateNumberFields,
} from './primitives';
import { assertLess } from './feedbackEffectPrimitives';
import { validateCriticalEffect } from './criticalFeedback';
import { validateSuperCriticalEffect } from './superCriticalFeedback';

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
    'durationMs', 'maximumConcurrent', 'holdUntilProgress', 'risePixels', 'startScale',
    'peakAtProgress', 'peakScale', 'endScale',
  ], { min: 0 });
  numberField(gain, 'durationMs', gainPath, { integer: true, min: 1 });
  numberField(gain, 'maximumConcurrent', gainPath, { integer: true, min: 1, max: 8 });
  ['holdUntilProgress', 'peakAtProgress'].forEach((field) => (
    numberField(gain, field, gainPath, { min: 0, max: 1 })
  ));
  assertLess(gain, gainPath, 'peakAtProgress', 'holdUntilProgress');
  return gain;
}

export function validateCookieFeedback(value: unknown): UnknownRecord {
  const path = 'COOKIE_FEEDBACK';
  const config = record(value, path);
  const audio = validateCookieAudio(config, path);
  const gain = validateFloatingGain(config, path);
  validateCriticalEffect(
    config,
    path,
    gain.durationMs as number,
    audio.criticalSparkleDelayMs as number,
  );
  validateSuperCriticalEffect(
    config,
    path,
    gain.durationMs as number,
    audio.superCriticalShockwaveDelayMs as number,
  );
  return config;
}
