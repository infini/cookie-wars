import { AUDIO_SETTINGS } from '../config';
import type { SoundVolumeLevel } from '../types/game';
import { clampSafeInteger } from './safeNumbers';

export function normalizeSoundVolumeLevel(level?: number): SoundVolumeLevel {
  const requested = clampSafeInteger(level, {
    fallback: AUDIO_SETTINGS.defaultLevel,
    minimum: 1,
    maximum: 5,
  });
  return AUDIO_SETTINGS.levels.find((item) => item.level === requested)?.level
    ?? AUDIO_SETTINGS.defaultLevel;
}
