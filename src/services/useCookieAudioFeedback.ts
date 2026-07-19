import { useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AUDIO_SETTINGS, COOKIE_FEEDBACK } from '../config';
import type {
  CookieClickKind,
  CookieFeedbackTier,
  CookieFragmentKind,
  SoundVolumeLevel,
} from '../types/game';
import {
  canPlayCookieClick,
  getCookieFeedbackTier,
  selectCookieVoiceIndex,
} from './cookieFeedback';
import { useCookieSpecialAudioFeedback } from './useCookieSpecialAudioFeedback';

interface CookieAudioFeedbackOptions {
  soundEnabled: boolean;
  soundVolumeLevel: SoundVolumeLevel;
}

interface CookieAudioFeedbackValue {
  playCookieClick: (kind: CookieClickKind) => CookieFeedbackTier;
  playCookieFragment: (kind: CookieFragmentKind) => void;
  stopCookieSounds: () => void;
}

/** 빠른 일반 클릭의 보이스 풀을 소유하고 특수 사운드는 전용 훅에 위임한다. */
export function useCookieAudioFeedback({
  soundEnabled,
  soundVolumeLevel,
}: CookieAudioFeedbackOptions): CookieAudioFeedbackValue {
  const voice1 = useAudioPlayer(require('../../assets/audio/cookie-click-crunch.mp3'));
  const voice2 = useAudioPlayer(require('../../assets/audio/cookie-click-crunch.mp3'));
  const voice3 = useAudioPlayer(require('../../assets/audio/cookie-click-crunch.mp3'));
  const voices = useMemo(() => [voice1, voice2, voice3], [voice1, voice2, voice3]);
  const {
    playCritical,
    playFragment,
    stopAll: stopAllSpecialSounds,
  } = useCookieSpecialAudioFeedback({ soundEnabled, soundVolumeLevel });
  const soundEnabledRef = useRef(soundEnabled);
  const playbackEpoch = useRef(0);
  const lastClickAt = useRef(Number.NEGATIVE_INFINITY);
  const lastFullCriticalAt = useRef(Number.NEGATIVE_INFINITY);
  const lastFullSuperCriticalAt = useRef(Number.NEGATIVE_INFINITY);
  const lastVoiceIndex = useRef(-1);
  const voiceRequestIds = useRef(
    COOKIE_FEEDBACK.audio.voicePlaybackRates.map(() => 0),
  );
  soundEnabledRef.current = soundEnabled;

  const stopCookieSounds = useCallback(() => {
    playbackEpoch.current += 1;
    voices.forEach((player) => {
      player.pause();
      void player.seekTo(0).catch(() => undefined);
    });
    stopAllSpecialSounds();
  }, [stopAllSpecialSounds, voices]);

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
  }, [soundVolumeLevel, voices]);

  useEffect(() => {
    if (!soundEnabled) stopCookieSounds();
  }, [soundEnabled, stopCookieSounds]);

  useEffect(() => stopCookieSounds, [stopCookieSounds]);

  const playCookieClick = useCallback((kind: CookieClickKind): CookieFeedbackTier => {
    const now = Date.now();
    const tier = getCookieFeedbackTier(
      kind,
      lastFullCriticalAt.current,
      lastFullSuperCriticalAt.current,
      now,
      COOKIE_FEEDBACK.audio.minimumFullCriticalIntervalMs,
      COOKIE_FEEDBACK.audio.minimumFullSuperCriticalIntervalMs,
    );
    if (tier === 'criticalFull') lastFullCriticalAt.current = now;
    if (tier === 'superCriticalFull') {
      lastFullCriticalAt.current = now;
      lastFullSuperCriticalAt.current = now;
    }
    if (kind !== 'normal') playCritical(kind);
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
        ) voice.play();
      }).catch(() => undefined);
    }
    return tier;
  }, [playCritical, voices]);

  return {
    playCookieClick,
    playCookieFragment: playFragment,
    stopCookieSounds,
  };
}
