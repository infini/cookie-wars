import { useAudioPlayer } from 'expo-audio';
import { useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import { AUDIO_SETTINGS, CLICKER_ROBOTS } from '../config';
import { getClickerRobotSoundIntervalMs } from '../domain/clickerRobotAudio';
import type { SoundVolumeLevel } from '../types/game';

interface ClickerRobotAudioOptions {
  robotCount: number;
  clicksPerSecondPerRobot: number;
  soundEnabled: boolean;
  soundVolumeLevel: SoundVolumeLevel;
}

export function useClickerRobotAudio({
  robotCount,
  clicksPerSecondPerRobot,
  soundEnabled,
  soundVolumeLevel,
}: ClickerRobotAudioOptions): void {
  const voice1 = useAudioPlayer(require('../../assets/audio/clicker-hammer-1.ogg'));
  const voice2 = useAudioPlayer(require('../../assets/audio/clicker-hammer-2.ogg'));
  const voice3 = useAudioPlayer(require('../../assets/audio/clicker-hammer-3.ogg'));
  const players = useMemo(() => [voice1, voice2, voice3], [voice1, voice2, voice3]);
  const nextVoice = useRef(0);
  const playbackEpoch = useRef(0);

  useEffect(() => {
    const volume = AUDIO_SETTINGS.levels.find(
      (item) => item.level === soundVolumeLevel,
    )?.volume ?? AUDIO_SETTINGS.levels[0].volume;
    players.forEach((player) => {
      player.volume = volume * CLICKER_ROBOTS.sound.volumeMultiplier;
    });
  }, [players, soundVolumeLevel]);

  useEffect(() => {
    if (!soundEnabled || robotCount <= 0 || clicksPerSecondPerRobot <= 0) {
      playbackEpoch.current += 1;
      players.forEach((player) => {
        player.pause();
      });
      return undefined;
    }
    const playNextHit = () => {
      if (AppState.currentState !== 'active') return;
      const requestedEpoch = playbackEpoch.current;
      const player = players[nextVoice.current % players.length];
      nextVoice.current += 1;
      void player.seekTo(0).then(() => {
        if (
          requestedEpoch === playbackEpoch.current
          && AppState.currentState === 'active'
        ) player.play();
      }).catch(() => undefined);
    };
    const timer = setInterval(
      playNextHit,
      getClickerRobotSoundIntervalMs(clicksPerSecondPerRobot),
    );
    return () => {
      clearInterval(timer);
      playbackEpoch.current += 1;
    };
  }, [clicksPerSecondPerRobot, players, robotCount, soundEnabled]);
}
