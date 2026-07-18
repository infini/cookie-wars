export type SoundVolumeLevel = 1 | 2 | 3 | 4 | 5;

export interface AudioLevelConfig {
  level: SoundVolumeLevel;
  volume: number;
}

export interface AudioSettingsConfig {
  defaultLevel: SoundVolumeLevel;
  previewDelayMs: number;
  levels: AudioLevelConfig[];
}

export interface BattleAudioConfig {
  minimumIntervalMs: {
    friendlyDisc: number;
    enemyDisc: number;
    giantDisc: number;
    hitLight: number;
    hitHeavy: number;
    bossMelee: number;
    bossEnrage: number;
  };
  volumeMultipliers: {
    friendlyDisc: number;
    enemyDisc: number;
    giantDisc: number;
    hitLight1: number;
    hitLight2: number;
    hitLight3: number;
    hitHeavy: number;
    bossMelee: number;
    bossEnrage: number;
    battleMusic: number;
  };
}
