import { useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AUDIO_SETTINGS, COOKIE_FEEDBACK, COOKIE_FRAGMENTS } from '../config';
import type { CookieFragmentKind, SoundVolumeLevel } from '../types/game';

type SpecialSoundKind = 'critical' | 'superCritical' | CookieFragmentKind;
type AudioPlayer = ReturnType<typeof useAudioPlayer>;

interface CookieSpecialAudioFeedbackOptions {
  soundEnabled: boolean;
  soundVolumeLevel: SoundVolumeLevel;
}

interface CookieSpecialAudioFeedbackValue {
  playCritical: (kind: 'critical' | 'superCritical') => void;
  playFragment: (kind: CookieFragmentKind) => void;
  stopAll: () => void;
}

const SPECIAL_SOUND_KINDS: SpecialSoundKind[] = [
  'critical', 'superCritical', 'magma', 'electric',
];

/** 같은 종류는 교체하고 서로 다른 종류는 함께 재생하는 특수 쿠키 사운드 조정자다. */
export function useCookieSpecialAudioFeedback({
  soundEnabled,
  soundVolumeLevel,
}: CookieSpecialAudioFeedbackOptions): CookieSpecialAudioFeedbackValue {
  const criticalImpact = useAudioPlayer(
    require('../../assets/audio/cookie-critical-impact.mp3'),
  );
  const criticalSparkle = useAudioPlayer(
    require('../../assets/audio/cookie-critical-sparkle.mp3'),
  );
  const superCriticalImpact = useAudioPlayer(
    require('../../assets/audio/cookie-super-critical-impact.mp3'),
  );
  const superCriticalShockwave = useAudioPlayer(
    require('../../assets/audio/cookie-super-critical-shockwave.mp3'),
  );
  const magmaFragment = useAudioPlayer(
    require('../../assets/audio/cookie-fragment-magma.mp3'),
  );
  const magmaFragmentEcho = useAudioPlayer(
    require('../../assets/audio/cookie-fragment-magma.mp3'),
  );
  const electricThunder1 = useAudioPlayer(
    require('../../assets/audio/cookie-fragment-thunder.mp3'),
  );
  const electricThunder2 = useAudioPlayer(
    require('../../assets/audio/cookie-fragment-thunder.mp3'),
  );
  const electricThunder3 = useAudioPlayer(
    require('../../assets/audio/cookie-fragment-thunder.mp3'),
  );
  const electricThunders = useMemo(
    () => [electricThunder1, electricThunder2, electricThunder3],
    [electricThunder1, electricThunder2, electricThunder3],
  );
  const magmaFragments = useMemo(
    () => [magmaFragment, magmaFragmentEcho],
    [magmaFragment, magmaFragmentEcho],
  );
  const playerGroups = useMemo<Record<SpecialSoundKind, AudioPlayer[]>>(
    () => ({
      critical: [criticalImpact, criticalSparkle],
      superCritical: [superCriticalImpact, superCriticalShockwave],
      magma: magmaFragments,
      electric: electricThunders,
    }),
    [
      criticalImpact,
      criticalSparkle,
      electricThunders,
      magmaFragments,
      superCriticalImpact,
      superCriticalShockwave,
    ],
  );
  const soundEnabledRef = useRef(soundEnabled);
  const playbackEpoch = useRef(0);
  const requestIds = useRef<Record<SpecialSoundKind, number>>({
    critical: 0,
    superCritical: 0,
    magma: 0,
    electric: 0,
  });
  const pendingTimeouts = useRef<Record<SpecialSoundKind, Set<ReturnType<typeof setTimeout>>>>({
    critical: new Set(),
    superCritical: new Set(),
    magma: new Set(),
    electric: new Set(),
  });
  soundEnabledRef.current = soundEnabled;

  const cancelPending = useCallback((kind?: SpecialSoundKind) => {
    const kinds = kind ? [kind] : SPECIAL_SOUND_KINDS;
    kinds.forEach((targetKind) => {
      pendingTimeouts.current[targetKind].forEach(clearTimeout);
      pendingTimeouts.current[targetKind].clear();
    });
  }, []);

  const stopKind = useCallback((kind: SpecialSoundKind) => {
    requestIds.current[kind] += 1;
    cancelPending(kind);
    playerGroups[kind].forEach((player) => {
      player.pause();
      void player.seekTo(0).catch(() => undefined);
    });
  }, [cancelPending, playerGroups]);

  const stopAll = useCallback(() => {
    playbackEpoch.current += 1;
    SPECIAL_SOUND_KINDS.forEach((kind) => stopKind(kind));
  }, [stopKind]);

  useEffect(() => {
    const volume = AUDIO_SETTINGS.levels.find(
      (item) => item.level === soundVolumeLevel,
    )?.volume ?? AUDIO_SETTINGS.levels[0].volume;
    criticalImpact.volume = volume
      * AUDIO_SETTINGS.soundVolumeMultipliers.critical
      * COOKIE_FEEDBACK.audio.criticalImpactVolumeMultiplier;
    criticalSparkle.volume = volume
      * AUDIO_SETTINGS.soundVolumeMultipliers.critical
      * COOKIE_FEEDBACK.audio.criticalSparkleVolumeMultiplier;
    superCriticalImpact.volume = volume
      * AUDIO_SETTINGS.soundVolumeMultipliers.critical
      * COOKIE_FEEDBACK.audio.superCriticalImpactVolumeMultiplier;
    superCriticalShockwave.volume = volume
      * AUDIO_SETTINGS.soundVolumeMultipliers.critical
      * COOKIE_FEEDBACK.audio.superCriticalShockwaveVolumeMultiplier;
    magmaFragments.forEach((player) => {
      player.volume = volume * COOKIE_FRAGMENTS.audio.magmaVolumeMultiplier;
    });
    electricThunders.forEach((player) => {
      player.volume = volume * COOKIE_FRAGMENTS.audio.electricThunderVolumeMultiplier;
    });
  }, [
    criticalImpact,
    criticalSparkle,
    electricThunders,
    magmaFragments,
    soundVolumeLevel,
    superCriticalImpact,
    superCriticalShockwave,
  ]);

  const playFromStart = useCallback((kind: SpecialSoundKind, player: AudioPlayer) => {
    const requestedEpoch = playbackEpoch.current;
    const requestId = requestIds.current[kind];
    void player.seekTo(0).then(() => {
      if (
        requestedEpoch === playbackEpoch.current
        && requestId === requestIds.current[kind]
        && soundEnabledRef.current
      ) player.play();
    }).catch(() => undefined);
  }, []);

  const schedule = useCallback((
    kind: SpecialSoundKind,
    player: AudioPlayer,
    delayMs: number,
  ) => {
    const timeout = setTimeout(() => {
      pendingTimeouts.current[kind].delete(timeout);
      playFromStart(kind, player);
    }, delayMs);
    pendingTimeouts.current[kind].add(timeout);
  }, [playFromStart]);

  const playCritical = useCallback((kind: 'critical' | 'superCritical') => {
    stopKind(kind);
    if (!soundEnabledRef.current) return;
    if (kind === 'critical') {
      playFromStart(kind, criticalImpact);
      schedule(
        kind,
        criticalSparkle,
        COOKIE_FEEDBACK.audio.criticalSparkleDelayMs,
      );
      return;
    }
    playFromStart(kind, superCriticalImpact);
    schedule(
      kind,
      superCriticalShockwave,
      COOKIE_FEEDBACK.audio.superCriticalShockwaveDelayMs,
    );
  }, [
    criticalImpact,
    criticalSparkle,
    playFromStart,
    schedule,
    stopKind,
    superCriticalImpact,
    superCriticalShockwave,
  ]);

  const playFragment = useCallback((kind: CookieFragmentKind) => {
    stopKind(kind);
    if (!soundEnabledRef.current) return;
    if (kind === 'magma') {
      magmaFragments
        .slice(0, COOKIE_FRAGMENTS.audio.magmaRepeatCount)
        .forEach((player, index) => {
          if (index === 0) playFromStart(kind, player);
          else schedule(
            kind,
            player,
            index * COOKIE_FRAGMENTS.audio.magmaRepeatIntervalMs,
          );
        });
      return;
    }
    electricThunders
      .slice(0, COOKIE_FRAGMENTS.audio.electricThunderRepeatCount)
      .forEach((player, index) => schedule(
        kind,
        player,
        COOKIE_FRAGMENTS.audio.electricThunderDelayMs
          + index * COOKIE_FRAGMENTS.audio.electricThunderRepeatIntervalMs,
      ));
  }, [electricThunders, magmaFragments, playFromStart, schedule, stopKind]);

  return { playCritical, playFragment, stopAll };
}
