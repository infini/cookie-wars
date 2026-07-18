import { useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AUDIO_SETTINGS, COOKIE_FEEDBACK } from '../config';
import { CookieFeedbackTier, SoundVolumeLevel } from '../types/game';
import {
  canPlayCookieClick,
  getCookieFeedbackTier,
  selectCookieVoiceIndex,
} from './cookieFeedback';

interface CookieAudioFeedbackOptions {
  soundEnabled: boolean;
  soundVolumeLevel: SoundVolumeLevel;
}

interface CookieAudioFeedbackValue {
  playCookieClick: (critical: boolean) => CookieFeedbackTier;
  stopCookieSounds: () => void;
}

/**
 * 쿠키 클릭 전용 보이스 풀·크리티컬 레이어·예약 취소를 소유한다.
 * 짧은 연속 입력이 앞 음원을 끊지 않도록 검증된 3보이스 풀을 사용한다.
 */
export function useCookieAudioFeedback({
  soundEnabled,
  soundVolumeLevel,
}: CookieAudioFeedbackOptions): CookieAudioFeedbackValue {
  const voice1 = useAudioPlayer(require('../../assets/audio/cookie-click-crunch.mp3'));
  const voice2 = useAudioPlayer(require('../../assets/audio/cookie-click-crunch.mp3'));
  const voice3 = useAudioPlayer(require('../../assets/audio/cookie-click-crunch.mp3'));
  const criticalImpact = useAudioPlayer(
    require('../../assets/audio/cookie-critical-impact.mp3'),
  );
  const criticalSparkle = useAudioPlayer(
    require('../../assets/audio/cookie-critical-sparkle.mp3'),
  );
  const voices = useMemo(() => [voice1, voice2, voice3], [voice1, voice2, voice3]);
  const allPlayers = useMemo(
    () => [...voices, criticalImpact, criticalSparkle],
    [criticalImpact, criticalSparkle, voices],
  );
  const soundEnabledRef = useRef(soundEnabled);
  const playbackEpoch = useRef(0);
  const lastClickAt = useRef(Number.NEGATIVE_INFINITY);
  const lastFullCriticalAt = useRef(Number.NEGATIVE_INFINITY);
  const lastVoiceIndex = useRef(-1);
  const voiceRequestIds = useRef(
    COOKIE_FEEDBACK.audio.voicePlaybackRates.map(() => 0),
  );
  const pendingTimeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  soundEnabledRef.current = soundEnabled;

  const cancelPendingSounds = useCallback(() => {
    pendingTimeouts.current.forEach(clearTimeout);
    pendingTimeouts.current.clear();
  }, []);

  const stopCookieSounds = useCallback(() => {
    playbackEpoch.current += 1;
    cancelPendingSounds();
    allPlayers.forEach((player) => {
      player.pause();
      void player.seekTo(0).catch(() => undefined);
    });
  }, [allPlayers, cancelPendingSounds]);

  useEffect(() => {
    const volume = AUDIO_SETTINGS.levels.find(
      (item) => item.level === soundVolumeLevel,
    )?.volume ?? AUDIO_SETTINGS.levels[0].volume;
    voices.forEach((player, index) => {
      player.volume = volume
        * AUDIO_SETTINGS.soundVolumeMultipliers.cookie
        * COOKIE_FEEDBACK.audio.voiceVolumeMultipliers[index];
      player.setPlaybackRate(COOKIE_FEEDBACK.audio.voicePlaybackRates[index]);
    });
    criticalImpact.volume = volume
      * AUDIO_SETTINGS.soundVolumeMultipliers.critical
      * COOKIE_FEEDBACK.audio.criticalImpactVolumeMultiplier;
    criticalSparkle.volume = volume
      * AUDIO_SETTINGS.soundVolumeMultipliers.critical
      * COOKIE_FEEDBACK.audio.criticalSparkleVolumeMultiplier;
  }, [criticalImpact, criticalSparkle, soundVolumeLevel, voices]);

  useEffect(() => {
    if (!soundEnabled) stopCookieSounds();
  }, [soundEnabled, stopCookieSounds]);

  useEffect(() => stopCookieSounds, [stopCookieSounds]);

  const playCookieClick = useCallback((critical: boolean): CookieFeedbackTier => {
    const now = Date.now();
    const tier = getCookieFeedbackTier(
      critical,
      lastFullCriticalAt.current,
      now,
      COOKIE_FEEDBACK.audio.minimumFullCriticalIntervalMs,
    );
    if (tier === 'criticalFull') lastFullCriticalAt.current = now;
    if (!soundEnabledRef.current) return tier;

    if (canPlayCookieClick(
      lastClickAt.current,
      now,
      COOKIE_FEEDBACK.audio.minimumClickIntervalMs,
    )) {
      lastClickAt.current = now;
      const voiceIndex = selectCookieVoiceIndex(
        lastVoiceIndex.current,
        Math.random(),
        voices.length,
      );
      lastVoiceIndex.current = voiceIndex;
      const requestId = ++voiceRequestIds.current[voiceIndex];
      const requestedEpoch = playbackEpoch.current;
      const voice = voices[voiceIndex];
      void voice.seekTo(0).then(() => {
        if (
          requestedEpoch === playbackEpoch.current
          && requestId === voiceRequestIds.current[voiceIndex]
          && soundEnabledRef.current
        ) {
          voice.play();
        }
      }).catch(() => undefined);
    }

    if (tier === 'criticalFull') {
      const requestedEpoch = playbackEpoch.current;
      void criticalImpact.seekTo(0).then(() => {
        if (requestedEpoch === playbackEpoch.current && soundEnabledRef.current) {
          criticalImpact.play();
        }
      }).catch(() => undefined);
      const timeout = setTimeout(() => {
        pendingTimeouts.current.delete(timeout);
        void criticalSparkle.seekTo(0).then(() => {
          if (requestedEpoch === playbackEpoch.current && soundEnabledRef.current) {
            criticalSparkle.play();
          }
        }).catch(() => undefined);
      }, COOKIE_FEEDBACK.audio.criticalSparkleDelayMs);
      pendingTimeouts.current.add(timeout);
    }
    return tier;
  }, [criticalImpact, criticalSparkle, voices]);

  return { playCookieClick, stopCookieSounds };
}
