import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { AUDIO_SETTINGS, BATTLE_AUDIO } from '../config';
import { useGame } from '../state/GameContext';
import {
  BATTLE_ACTION_SOUND_NAMES,
  BattleActionSoundName,
  BattleSoundGroup,
  canPlayBattleActionSound,
  getBattleSoundGroup,
  isBattleActionSound,
} from './battleAudio';

export type SoundName =
  | 'cookie'
  | 'critical'
  | 'menu'
  | 'upgrade'
  | 'blocked'
  | BattleActionSoundName;

interface FeedbackContextValue {
  play: (name: SoundName) => void;
  startBattleMusic: () => void;
  stopBattleSounds: () => void;
  tap: () => void;
  success: () => void;
  error: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: PropsWithChildren) {
  const { state } = useGame();
  const cookie = useAudioPlayer(require('../../assets/audio/cookie-click.ogg'));
  const critical = useAudioPlayer(require('../../assets/audio/cookie-critical-explosion.wav'));
  const menu = useAudioPlayer(require('../../assets/audio/menu-select.ogg'));
  const upgrade = useAudioPlayer(require('../../assets/audio/upgrade.ogg'));
  const blocked = useAudioPlayer(require('../../assets/audio/blocked.ogg'));
  const friendlyDisc = useAudioPlayer(require('../../assets/audio/disc-friendly.ogg'));
  const enemyDisc = useAudioPlayer(require('../../assets/audio/disc-enemy.ogg'));
  const giantDisc = useAudioPlayer(require('../../assets/audio/disc-giant.ogg'));
  const hitLight1 = useAudioPlayer(require('../../assets/audio/hit-light-1.ogg'));
  const hitLight2 = useAudioPlayer(require('../../assets/audio/hit-light-2.ogg'));
  const hitLight3 = useAudioPlayer(require('../../assets/audio/hit-light-3.ogg'));
  const hitHeavy = useAudioPlayer(require('../../assets/audio/hit-heavy.ogg'));
  const bossMelee = useAudioPlayer(require('../../assets/audio/boss-melee.ogg'));
  const bossEnrage = useAudioPlayer(require('../../assets/audio/boss-enrage.ogg'));
  const battleMusic = useAudioPlayer(require('../../assets/audio/battle-loop.ogg'));

  const players = useMemo(
    () => ({
      cookie,
      critical,
      menu,
      upgrade,
      blocked,
      friendlyDisc,
      enemyDisc,
      giantDisc,
      hitLight1,
      hitLight2,
      hitLight3,
      hitHeavy,
      bossMelee,
      bossEnrage,
      battleMusic,
    }),
    [
      cookie,
      critical,
      menu,
      upgrade,
      blocked,
      friendlyDisc,
      enemyDisc,
      giantDisc,
      hitLight1,
      hitLight2,
      hitLight3,
      hitHeavy,
      bossMelee,
      bossEnrage,
      battleMusic,
    ],
  );
  const playbackEpoch = useRef(0);
  const lastBattleSoundAt = useRef<Partial<Record<BattleSoundGroup, number>>>({});

  const stopBattleSounds = useCallback(() => {
    playbackEpoch.current += 1;
    lastBattleSoundAt.current = {};
    BATTLE_ACTION_SOUND_NAMES.forEach((name) => {
      const player = players[name];
      player.pause();
      void player.seekTo(0).catch(() => undefined);
    });
    battleMusic.pause();
    void battleMusic.seekTo(0).catch(() => undefined);
  }, [battleMusic, players]);

  useEffect(() => {
    const volume = AUDIO_SETTINGS.levels.find(
      (item) => item.level === state.soundVolumeLevel,
    )?.volume ?? AUDIO_SETTINGS.levels[0].volume;
    Object.entries(players).forEach(([name, player]) => {
      const soundMultiplier = name in BATTLE_AUDIO.volumeMultipliers
        ? BATTLE_AUDIO.volumeMultipliers[
          name as keyof typeof BATTLE_AUDIO.volumeMultipliers
        ]
        : AUDIO_SETTINGS.soundVolumeMultipliers[
          name as keyof typeof AUDIO_SETTINGS.soundVolumeMultipliers
        ];
      player.volume = volume * soundMultiplier;
    });
    battleMusic.loop = true;
  }, [players, state.soundVolumeLevel]);

  useEffect(() => {
    if (state.soundEnabled) return;
    playbackEpoch.current += 1;
    Object.values(players).forEach((player) => {
      player.pause();
      void player.seekTo(0).catch(() => undefined);
    });
  }, [players, state.soundEnabled]);

  const play = useCallback(
    (name: SoundName) => {
      if (!state.soundEnabled) return;
      const now = Date.now();
      if (isBattleActionSound(name)) {
        if (!canPlayBattleActionSound(name, lastBattleSoundAt.current, now)) return;
        lastBattleSoundAt.current[getBattleSoundGroup(name)] = now;
      }
      const requestedEpoch = playbackEpoch.current;
      const player = players[name];
      void player.seekTo(0).then(() => {
        if (requestedEpoch === playbackEpoch.current && state.soundEnabled) player.play();
      }).catch(() => undefined);
    },
    [players, state.soundEnabled],
  );

  const startBattleMusic = useCallback(() => {
    if (!state.soundEnabled) return;
    const requestedEpoch = playbackEpoch.current;
    void battleMusic.seekTo(0).then(() => {
      if (requestedEpoch === playbackEpoch.current && state.soundEnabled) {
        battleMusic.play();
      }
    }).catch(() => undefined);
  }, [battleMusic, state.soundEnabled]);

  const tap = useCallback(() => {
    if (!state.vibrationEnabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [state.vibrationEnabled]);

  const success = useCallback(() => {
    if (!state.vibrationEnabled) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [state.vibrationEnabled]);

  const error = useCallback(() => {
    if (!state.vibrationEnabled) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [state.vibrationEnabled]);

  const value = useMemo(
    () => ({ play, startBattleMusic, stopBattleSounds, tap, success, error }),
    [play, startBattleMusic, stopBattleSounds, tap, success, error],
  );
  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback은 FeedbackProvider 안에서 사용해야 합니다.');
  return context;
}
