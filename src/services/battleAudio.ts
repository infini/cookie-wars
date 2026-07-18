import { BATTLE_AUDIO } from '../config';

export type BattleActionSoundName = 'disc' | 'hit' | 'enemyDefeated';

export const BATTLE_ACTION_SOUND_NAMES: BattleActionSoundName[] = [
  'disc',
  'hit',
  'enemyDefeated',
];

export function isBattleActionSound(name: string): name is BattleActionSoundName {
  return BATTLE_ACTION_SOUND_NAMES.includes(name as BattleActionSoundName);
}

export function canPlayBattleActionSound(
  name: BattleActionSoundName,
  lastPlayedAt: Partial<Record<BattleActionSoundName, number>>,
  now: number,
): boolean {
  return now - (lastPlayedAt[name] ?? Number.NEGATIVE_INFINITY)
    >= BATTLE_AUDIO.minimumIntervalMs[name];
}
