import { CookieFeedbackTier } from '../types/game';

export function getCookieFeedbackTier(
  critical: boolean,
  lastFullCriticalAt: number,
  now: number,
  minimumFullCriticalIntervalMs: number,
): CookieFeedbackTier {
  if (!critical) return 'normal';
  return now - lastFullCriticalAt >= minimumFullCriticalIntervalMs
    ? 'criticalFull'
    : 'criticalCompact';
}

export function selectCookieVoiceIndex(
  previousIndex: number,
  randomUnit: number,
  voiceCount: number,
): number {
  if (!Number.isSafeInteger(voiceCount) || voiceCount <= 0) {
    throw new Error('쿠키 클릭 보이스는 하나 이상이어야 합니다.');
  }
  const boundedRandom = Math.min(Math.max(randomUnit, 0), 1 - Number.EPSILON);
  if (voiceCount === 1 || previousIndex < 0 || previousIndex >= voiceCount) {
    return Math.floor(boundedRandom * voiceCount);
  }
  const candidate = Math.floor(boundedRandom * (voiceCount - 1));
  return candidate >= previousIndex ? candidate + 1 : candidate;
}

export function canPlayCookieClick(
  lastPlayedAt: number,
  now: number,
  minimumIntervalMs: number,
): boolean {
  return now - lastPlayedAt >= minimumIntervalMs;
}
