import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { AUDIO_SETTINGS } from '../config';
import { useGame } from '../state/GameContext';

export type SoundName =
  | 'cookie'
  | 'menu'
  | 'upgrade'
  | 'blocked'
  | 'hit'
  | 'disc'
  | 'enemyDefeated';

interface FeedbackContextValue {
  play: (name: SoundName) => void;
  tap: () => void;
  success: () => void;
  error: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: PropsWithChildren) {
  const { state } = useGame();
  const cookie = useAudioPlayer(require('../../assets/audio/cookie-click.ogg'));
  const menu = useAudioPlayer(require('../../assets/audio/menu-select.ogg'));
  const upgrade = useAudioPlayer(require('../../assets/audio/upgrade.ogg'));
  const blocked = useAudioPlayer(require('../../assets/audio/blocked.ogg'));
  const hit = useAudioPlayer(require('../../assets/audio/hit.ogg'));
  const disc = useAudioPlayer(require('../../assets/audio/disc-throw.ogg'));
  const enemyDefeated = useAudioPlayer(require('../../assets/audio/enemy-defeated.ogg'));

  const players = useMemo(
    () => ({ cookie, menu, upgrade, blocked, hit, disc, enemyDefeated }),
    [cookie, menu, upgrade, blocked, hit, disc, enemyDefeated],
  );

  useEffect(() => {
    const volume = AUDIO_SETTINGS.levels.find(
      (item) => item.level === state.soundVolumeLevel,
    )?.volume ?? AUDIO_SETTINGS.levels[0].volume;
    Object.values(players).forEach((player) => {
      player.volume = volume;
    });
  }, [players, state.soundVolumeLevel]);

  const play = useCallback(
    (name: SoundName) => {
      if (!state.soundEnabled) return;
      const player = players[name];
      void player.seekTo(0).then(() => player.play()).catch(() => undefined);
    },
    [players, state.soundEnabled],
  );

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

  const value = useMemo(() => ({ play, tap, success, error }), [play, tap, success, error]);
  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback은 FeedbackProvider 안에서 사용해야 합니다.');
  return context;
}
